"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ACCOUNTS, AccountId, Asset, Order, AccountData, JournalEntry } from '../data/portfolio';
import { STRATEGIES, Strategy, TRADE_FEE_PERCENT } from '../data/strategy';

// ─── localStorage helpers ───
const STORAGE_PREFIX = 'smartfolio_';

function storageKey(accountId: AccountId, key: string) {
    return `${STORAGE_PREFIX}${accountId}_${key}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded */ }
}

// ─── Journal Entry ───
// JournalEntry imported from data/portfolio

// ─── Context Interface ───
interface PortfolioContextType {
    // Account
    activeAccount: AccountId;
    activeStrategy: Strategy;
    accountData: AccountData;
    switchAccount: (id: AccountId) => void;

    // State
    totalValue: number;
    targetValue: number;
    setTargetValue: (v: number) => void;
    cashBalance: number;
    assets: Asset[];
    pendingOrders: Order[];
    recycledToSui: number;
    marketTrends: Record<string, number[]>;
    journal: JournalEntry[];
    mounted: boolean;

    // Actions
    recyclePnL: (symbol: string) => void;
    fillOrder: (orderId: string) => void;
    killOrder: (orderId: string) => void;
    addOrder: (order: Omit<Order, 'status' | 'id' | 'date'> & { status?: 'open' | 'filled' | 'cancelled'; date?: string; id?: string }) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
    removeJournalEntry: (id: string) => void;
    syncAssetBalance: (symbol: string, units: number) => void;
    resetToDefaults: () => void;
    isLiveMode: boolean;
    toggleLiveMode: () => void;
    importAsset: (symbol: string) => Promise<void>;
    exportData: () => string;
    importData: (json: string) => boolean;
    marketCondition: 'accumulation' | 'bull' | 'bear' | 'distribution' | 'choppiness';
    setMarketCondition: (condition: 'accumulation' | 'bull' | 'bear' | 'distribution' | 'choppiness') => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// ─── Load account state from localStorage or seed ───
function loadAccountState(accountId: AccountId) {
    const seed = ACCOUNTS[accountId];
    return {
        assets: loadFromStorage<Asset[]>(storageKey(accountId, 'assets'), seed.assets),
        pendingOrders: loadFromStorage<Order[]>(storageKey(accountId, 'orders'), seed.pendingOrders),
        recycledToSui: loadFromStorage<number>(storageKey(accountId, 'recycled'), seed.recycledToSui || 0),
        journal: loadFromStorage<JournalEntry[]>(storageKey(accountId, 'journal'), seed.journal || []),
        targetValue: loadFromStorage<number>(storageKey(accountId, 'target'), seed.targetValue || 0),
    };
}

// ─── Save account state to localStorage ───
function saveAccountState(accountId: AccountId, state: {
    assets: Asset[];
    pendingOrders: Order[];
    recycledToSui: number;
    journal: JournalEntry[];
    targetValue: number;
}) {
    saveToStorage(storageKey(accountId, 'assets'), state.assets);
    saveToStorage(storageKey(accountId, 'orders'), state.pendingOrders);
    saveToStorage(storageKey(accountId, 'recycled'), state.recycledToSui);
    saveToStorage(storageKey(accountId, 'journal'), state.journal);
    saveToStorage(storageKey(accountId, 'target'), state.targetValue);
}

// ═══════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════
export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [activeAccount, setActiveAccount] = useState<AccountId>('sui');
    const [assets, setAssets] = useState<Asset[]>(ACCOUNTS.sui.assets);
    const [pendingOrders, setPendingOrders] = useState<Order[]>(ACCOUNTS.sui.pendingOrders);
    const [recycledToSui, setRecycledToSui] = useState(ACCOUNTS.sui.recycledToSui || 0);
    const [targetValue, setTargetValue] = useState(ACCOUNTS.sui.targetValue || 35000);
    const [marketTrends] = useState(ACCOUNTS.sui.marketTrends);
    const [journal, setJournal] = useState<JournalEntry[]>([]);
    const [marketCondition, setMarketCondition] = useState<'accumulation' | 'bull' | 'bear' | 'distribution' | 'choppiness'>('accumulation');

    const activeStrategy = STRATEGIES[activeAccount];
    const accountData = ACCOUNTS[activeAccount];

    // Hydration: load from localStorage on mount
    useEffect(() => {
        const savedAccount = loadFromStorage<AccountId>(`${STORAGE_PREFIX}activeAccount`, 'sui');
        const state = loadAccountState(savedAccount);
        setActiveAccount(savedAccount);
        setAssets(state.assets);
        setPendingOrders(state.pendingOrders);
        setRecycledToSui(state.recycledToSui);
        setJournal(state.journal);
        setTargetValue(state.targetValue);
        setMounted(true);
    }, []);

    // Persist on state changes (skip before hydration)
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) { hasHydrated.current = true; return; }
        if (!hasHydrated.current) { hasHydrated.current = true; return; }
        saveAccountState(activeAccount, { assets, pendingOrders, recycledToSui, journal, targetValue });
    }, [assets, pendingOrders, recycledToSui, journal, targetValue, mounted, activeAccount]);

    // Derived values
    const cashBalance = assets.find(a => a.symbol === 'USD')?.currentValue || 0;
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    // ─── Account Switching ───
    const switchAccount = useCallback((id: AccountId) => {
        if (id === activeAccount) return;

        // Save current account state
        saveAccountState(activeAccount, { assets, pendingOrders, recycledToSui, journal, targetValue });

        // Load target account
        const state = loadAccountState(id);
        setActiveAccount(id);
        setAssets(state.assets);
        setPendingOrders(state.pendingOrders);
        setRecycledToSui(state.recycledToSui);
        setJournal(state.journal);
        setTargetValue(state.targetValue);

        // Remember active account
        saveToStorage(`${STORAGE_PREFIX}activeAccount`, id);
    }, [activeAccount, assets, pendingOrders, recycledToSui, journal, targetValue]);

    // ─── Market Simulation & Live Mode ───
    const [isLiveMode, setIsLiveMode] = useState(false);

    // Auto-Reload (60s) if Live Mode is active
    useEffect(() => {
        if (!isLiveMode) return;
        const interval = setInterval(() => {
            if (typeof window !== 'undefined') window.location.reload();
        }, 60000); // 60s
        return () => clearInterval(interval);
    }, [isLiveMode]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAssets(prev => {
                const updated = prev.map(asset => {
                    if (asset.symbol === 'USD') return asset;
                    const volatility = 0.0008;
                    const change = 1 + (Math.random() * volatility * 2 - volatility);
                    const newPrice = asset.currentPrice * change;
                    const newValue = asset.units * newPrice;
                    return {
                        ...asset,
                        currentPrice: newPrice,
                        currentValue: newValue,
                        gainLoss: newValue - (asset.totalCost || 0),
                    };
                });
                const freshTotal = updated.reduce((s, a) => s + a.currentValue, 0);
                return updated.map(a => ({ ...a, allocation: (a.currentValue / freshTotal) * 100 }));
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [activeAccount]); // restart sim on account switch

    // ─── Actions ───

    const recyclePnL = useCallback((symbol: string) => {
        const anchorSymbol = activeAccount === 'sui' ? 'SUI' : null;
        if (!anchorSymbol) return; // No recycle on alts account (no king)

        setAssets(prev => {
            const assetIndex = prev.findIndex(a => a.symbol === symbol);
            const anchorIndex = prev.findIndex(a => a.symbol === anchorSymbol);
            if (assetIndex === -1 || anchorIndex === -1) return prev;

            const asset = prev[assetIndex];
            const profit = Math.max(0, asset.gainLoss || 0);
            if (profit <= 0) return prev;

            const newAssets = [...prev];
            newAssets[assetIndex] = {
                ...asset,
                units: asset.units - (profit / asset.currentPrice),
                currentValue: asset.currentValue - profit,
                gainLoss: (asset.gainLoss || 0) - profit,
                totalCost: asset.totalCost || 0
            };

            const anchor = newAssets[anchorIndex];
            newAssets[anchorIndex] = {
                ...anchor,
                units: anchor.units + (profit / anchor.currentPrice),
                currentValue: anchor.currentValue + profit,
                totalCost: (anchor.totalCost || 0) + profit
            };

            setRecycledToSui(curr => curr + profit);
            return newAssets;
        });
    }, [activeAccount]);

    const killOrder = useCallback((id: string) => {
        setPendingOrders(prev => prev.filter(o => o.id !== id));
    }, []);

    const addOrder = useCallback((order: Omit<Order, 'status' | 'id' | 'date'> & { status?: 'open' | 'filled' | 'cancelled'; date?: string; id?: string }) => {
        const { date, status, id, ...rest } = order;
        const newOrder: Order = {
            ...rest,
            status: status || 'open',
            date: date || new Date().toISOString().split('T')[0],
            id: id || `${order.symbol}-${order.type}-${Date.now()}`,
        };
        setPendingOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
        });
    }, []);

    const fillOrder = useCallback((id: string) => {
        const order = pendingOrders.find(o => o.id === id);
        if (!order) return;

        setAssets(currentAssets => {
            const assetIndex = currentAssets.findIndex(a => a.symbol === order.symbol);
            const cost = order.units * order.price;

            if (assetIndex !== -1) {
                const asset = currentAssets[assetIndex];
                const next = [...currentAssets];
                next[assetIndex] = {
                    ...asset,
                    units: asset.units + (order.type === 'buy' ? order.units : -order.units),
                    totalCost: (asset.totalCost || 0) + (order.type === 'buy' ? cost : -cost),
                    currentValue: (asset.units + (order.type === 'buy' ? order.units : -order.units)) * asset.currentPrice
                };
                return next;
            }
            return currentAssets;
        });

        setPendingOrders(prev => prev.filter(o => o.id !== id));
    }, [pendingOrders]);

    const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
        const newEntry: JournalEntry = {
            id: entry.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            timestamp: entry.timestamp || new Date().toISOString(),
            ...entry,
        };

        // 1. Update Journal Log
        setJournal(prev => {
            if (prev.some(e => e.id === newEntry.id)) return prev; // Dedup
            return [newEntry, ...prev];
        });

        // 2. Execute Trade against Portfolio State (if price/units exist)
        if (newEntry.units && newEntry.price) {
            console.log(`[SmartFolio] Processing trade: ${newEntry.type} ${newEntry.units} ${newEntry.symbol} @ ${newEntry.price}`);
            setAssets(currentAssets => {
                const targetSymbol = newEntry.symbol.trim().toUpperCase();
                const assetIndex = currentAssets.findIndex(a => a.symbol.toUpperCase() === targetSymbol);
                const cashIndex = currentAssets.findIndex(a => a.symbol === 'USD');

                if (assetIndex === -1) {
                    console.warn(`[SmartFolio] Asset not found for trade: ${targetSymbol} (Available: ${currentAssets.map(a => a.symbol).join(', ')})`);
                    return currentAssets;
                }
                if (cashIndex === -1) {
                    console.error('[SmartFolio] Cash asset (USD) not found!');
                    return currentAssets;
                }

                const next = [...currentAssets];
                const asset = next[assetIndex];
                const cash = next[cashIndex];

                const gross = newEntry.units! * newEntry.price!;
                // Use global constant
                const feePercent = TRADE_FEE_PERCENT;
                const fee = gross * (feePercent / 100);

                if (newEntry.type === 'buy') {
                    // BUY: Asset +, Cash -
                    const cost = gross + fee;
                    next[cashIndex] = { ...cash, currentValue: cash.currentValue - cost, units: cash.units - cost };
                    next[assetIndex] = {
                        ...asset,
                        units: asset.units + newEntry.units!,
                        currentValue: (asset.units + newEntry.units!) * asset.currentPrice,
                        totalCost: (asset.totalCost || 0) + cost
                    };
                } else if (newEntry.type === 'sell') {
                    // SELL: Asset -, Cash +
                    const proceeds = gross - fee;
                    next[cashIndex] = { ...cash, currentValue: cash.currentValue + proceeds, units: cash.units + proceeds };
                    next[assetIndex] = {
                        ...asset,
                        units: Math.max(0, asset.units - newEntry.units!),
                        currentValue: Math.max(0, asset.units - newEntry.units!) * asset.currentPrice,
                        // Proportional cost basis reduction
                        totalCost: asset.units > 0 ? (asset.totalCost || 0) * (Math.max(0, asset.units - newEntry.units!) / asset.units) : 0
                    };
                }

                console.log(`[SmartFolio] Trade executed. New ${targetSymbol} units: ${next[assetIndex].units}, New Cash: ${next[cashIndex].units}`);
                return next;
            });
        }
    }, []);

    const removeJournalEntry = useCallback((id: string) => {
        setJournal(prev => prev.filter(e => e.id !== id));
    }, []);

    const syncAssetBalance = useCallback((symbol: string, units: number) => {
        setAssets(prev => {
            const target = symbol.trim().toUpperCase();
            const idx = prev.findIndex(a => a.symbol.toUpperCase() === target);
            if (idx === -1) {
                console.warn(`[SmartFolio] syncAssetBalance: Symbol ${target} not found.`);
                return prev;
            }

            const next = [...prev];
            const asset = next[idx];
            const safeUnits = isNaN(units) ? 0 : units;

            // Proportional cost adjustment
            let newCost = asset.totalCost || 0;
            if (asset.units > 0) {
                newCost = (asset.totalCost || 0) * (safeUnits / asset.units);
            } else if (safeUnits > 0) {
                // If starting from 0, assume cost basis = current value (0% PnL start)
                newCost = safeUnits * asset.currentPrice;
            }

            next[idx] = {
                ...asset,
                units: safeUnits,
                currentValue: safeUnits * asset.currentPrice,
                totalCost: newCost
            };

            console.log(`[SmartFolio] Synced ${target} to ${safeUnits} units.`);
            return next;
        });
    }, []);

    const toggleLiveMode = useCallback(() => setIsLiveMode(p => !p), []);

    const importAsset = useCallback(async (symbol: string) => {
        const target = symbol.trim().toUpperCase();
        console.log(`[SmartFolio] Importing asset: ${target}`);

        let price = 0;
        let logo = '';

        // 1. Fetch Price (Coinbase)
        try {
            const res = await fetch(`https://api.coinbase.com/v2/prices/${target}-USD/spot`);
            const data = await res.json();
            if (data?.data?.amount) {
                price = parseFloat(data.data.amount);
            }
        } catch (e) { console.error('Price fetch failed', e); }

        // 2. Fetch Logo (CoinGecko)
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${target}`);
            const data = await res.json();
            const coin = data.coins?.find((c: any) => c.symbol === target || c.symbol.toUpperCase() === target);
            if (coin) logo = coin.large || coin.thumb;
        } catch (e) { console.error('Logo fetch failed', e); }

        // 3. Add to Assets
        setAssets(prev => {
            if (prev.some(a => a.symbol === target)) return prev;
            return [...prev, {
                symbol: target,
                name: target,
                units: 0,
                avgCost: 0,
                currentPrice: price,
                currentValue: 0,
                totalCost: 0,
                gainLoss: 0,
                allocation: 0,
                targetAllocation: 0, // Manual set later
                logo: logo || undefined
            }];
        });
    }, []);

    const resetToDefaults = useCallback(() => {
        const seed = ACCOUNTS[activeAccount];
        // ... (existing logic)
        setAssets(seed.assets);
        setPendingOrders(seed.pendingOrders);
        setRecycledToSui(seed.recycledToSui || 0);
        setJournal(seed.journal || []);
        setTargetValue(seed.targetValue || (activeAccount === 'sui' ? 35000 : 200000));
        // Clear localStorage for this account
        ['assets', 'orders', 'recycled', 'journal', 'target'].forEach(key =>
            localStorage.removeItem(storageKey(activeAccount, key))
        );
    }, [activeAccount]);

    // ... (export/import logic)
    const exportData = useCallback(() => {
        return JSON.stringify({ activeAccount, assets, pendingOrders, recycledToSui, journal }, null, 2);
    }, [activeAccount, assets, pendingOrders, recycledToSui, journal]);

    const importData = useCallback((json: string): boolean => {
        try {
            const data = JSON.parse(json);
            if (data.assets) setAssets(data.assets);
            if (data.pendingOrders) setPendingOrders(data.pendingOrders);
            if (data.recycledToSui !== undefined) setRecycledToSui(data.recycledToSui);
            if (data.journal) setJournal(data.journal);
            return true;
        } catch {
            return false;
        }
    }, []);

    return (
        <PortfolioContext.Provider value={{
            activeAccount,
            activeStrategy,
            accountData,
            switchAccount,
            totalValue,
            targetValue,
            setTargetValue,
            cashBalance,
            assets,
            pendingOrders,
            recycledToSui,
            marketTrends,
            journal,
            mounted,
            recyclePnL,
            fillOrder,
            killOrder,
            addOrder,
            addJournalEntry,
            removeJournalEntry,
            syncAssetBalance,
            resetToDefaults,
            isLiveMode,
            toggleLiveMode,
            importAsset,
            exportData,
            importData,
            marketCondition,
            setMarketCondition
        }}>
            {children}
        </PortfolioContext.Provider>
    );
};

export const usePortfolio = () => {
    const context = useContext(PortfolioContext);
    if (!context) throw new Error('usePortfolio must be used within a PortfolioProvider');
    return context;
};
