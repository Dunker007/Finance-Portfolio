"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ACCOUNTS, AccountId, Asset, Order, AccountData } from '../data/portfolio';
import { STRATEGIES, Strategy } from '../data/strategy';

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
export interface JournalEntry {
    id: string;
    timestamp: string;
    symbol: string;
    type: 'buy' | 'sell' | 'note';
    price?: number;
    units?: number;
    notes: string;
}

// ─── Context Interface ───
interface PortfolioContextType {
    // Account
    activeAccount: AccountId;
    activeStrategy: Strategy;
    accountData: AccountData;
    switchAccount: (id: AccountId) => void;

    // State
    totalValue: number;
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
    addOrder: (order: Omit<Order, 'id' | 'status' | 'date'>) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    resetToDefaults: () => void;
    exportData: () => string;
    importData: (json: string) => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// ─── Load account state from localStorage or seed ───
function loadAccountState(accountId: AccountId) {
    const seed = ACCOUNTS[accountId];
    return {
        assets: loadFromStorage<Asset[]>(storageKey(accountId, 'assets'), seed.assets),
        pendingOrders: loadFromStorage<Order[]>(storageKey(accountId, 'orders'), seed.pendingOrders),
        recycledToSui: loadFromStorage<number>(storageKey(accountId, 'recycled'), seed.recycledToSui || 0),
        journal: loadFromStorage<JournalEntry[]>(storageKey(accountId, 'journal'), []),
    };
}

// ─── Save account state to localStorage ───
function saveAccountState(accountId: AccountId, state: {
    assets: Asset[];
    pendingOrders: Order[];
    recycledToSui: number;
    journal: JournalEntry[];
}) {
    saveToStorage(storageKey(accountId, 'assets'), state.assets);
    saveToStorage(storageKey(accountId, 'orders'), state.pendingOrders);
    saveToStorage(storageKey(accountId, 'recycled'), state.recycledToSui);
    saveToStorage(storageKey(accountId, 'journal'), state.journal);
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
    const [marketTrends] = useState(ACCOUNTS.sui.marketTrends);
    const [journal, setJournal] = useState<JournalEntry[]>([]);

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
        setMounted(true);
    }, []);

    // Persist on state changes (skip before hydration)
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) { hasHydrated.current = true; return; }
        saveAccountState(activeAccount, { assets, pendingOrders, recycledToSui, journal });
    }, [assets, pendingOrders, recycledToSui, journal, mounted, activeAccount]);

    // Derived values
    const cashBalance = assets.find(a => a.symbol === 'USD')?.currentValue || 0;
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    // ─── Account Switching ───
    const switchAccount = useCallback((id: AccountId) => {
        if (id === activeAccount) return;

        // Save current account state
        saveAccountState(activeAccount, { assets, pendingOrders, recycledToSui, journal });

        // Load target account
        const state = loadAccountState(id);
        setActiveAccount(id);
        setAssets(state.assets);
        setPendingOrders(state.pendingOrders);
        setRecycledToSui(state.recycledToSui);
        setJournal(state.journal);

        // Remember active account
        saveToStorage(`${STORAGE_PREFIX}activeAccount`, id);
    }, [activeAccount, assets, pendingOrders, recycledToSui, journal]);

    // ─── Market Simulation ───
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

    const addOrder = useCallback((order: Omit<Order, 'id' | 'status' | 'date'>) => {
        const newOrder: Order = {
            ...order,
            id: `${order.symbol}-${order.type}-${Date.now()}`,
            status: 'open',
            date: new Date().toISOString().split('T')[0],
        };
        setPendingOrders(prev => [...prev, newOrder]);
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

    const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
        const newEntry: JournalEntry = {
            ...entry,
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            timestamp: new Date().toISOString(),
        };
        setJournal(prev => [newEntry, ...prev]);
    }, []);

    const resetToDefaults = useCallback(() => {
        const seed = ACCOUNTS[activeAccount];
        setAssets(seed.assets);
        setPendingOrders(seed.pendingOrders);
        setRecycledToSui(seed.recycledToSui || 0);
        setJournal([]);
        // Clear localStorage for this account
        ['assets', 'orders', 'recycled', 'journal'].forEach(key =>
            localStorage.removeItem(storageKey(activeAccount, key))
        );
    }, [activeAccount]);

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
            resetToDefaults,
            exportData,
            importData
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
