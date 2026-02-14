"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PORTFOLIO_DATA, Asset, Order } from '../data/portfolio';

// ─── localStorage Keys ───
const STORAGE_KEYS = {
    assets: 'smartfolio_assets',
    orders: 'smartfolio_orders',
    recycled: 'smartfolio_recycled',
    journal: 'smartfolio_journal',
} as const;

// ─── Journal Entry Type ───
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
    totalValue: number;
    cashBalance: number;
    assets: Asset[];
    pendingOrders: Order[];
    recycledToSui: number;
    marketTrends: Record<string, number[]>;
    journal: JournalEntry[];
    mounted: boolean;
    recyclePnL: (symbol: string) => void;
    fillOrder: (orderId: string) => void;
    killOrder: (orderId: string) => void;
    addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    resetToDefaults: () => void;
    exportData: () => string;
    importData: (json: string) => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// ─── Safe localStorage helpers ───
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
    } catch { /* quota exceeded — fail silently */ }
}

// ─── Provider ───
export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [assets, setAssets] = useState<Asset[]>(PORTFOLIO_DATA.assets);
    const [pendingOrders, setPendingOrders] = useState<Order[]>(PORTFOLIO_DATA.pendingOrders);
    const [recycledToSui, setRecycledToSui] = useState(PORTFOLIO_DATA.recycledToSui || 0);
    const [marketTrends] = useState(PORTFOLIO_DATA.marketTrends);
    const [journal, setJournal] = useState<JournalEntry[]>([]);

    // Hydration: load from localStorage ONCE on mount
    useEffect(() => {
        setAssets(loadFromStorage(STORAGE_KEYS.assets, PORTFOLIO_DATA.assets));
        setPendingOrders(loadFromStorage(STORAGE_KEYS.orders, PORTFOLIO_DATA.pendingOrders));
        setRecycledToSui(loadFromStorage(STORAGE_KEYS.recycled, PORTFOLIO_DATA.recycledToSui || 0));
        setJournal(loadFromStorage(STORAGE_KEYS.journal, []));
        setMounted(true);
    }, []);

    // Persist on state changes (skip initial render before hydration)
    const hasHydrated = useRef(false);
    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) { hasHydrated.current = true; return; }
        saveToStorage(STORAGE_KEYS.assets, assets);
    }, [assets, mounted]);

    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) return;
        saveToStorage(STORAGE_KEYS.orders, pendingOrders);
    }, [pendingOrders, mounted]);

    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) return;
        saveToStorage(STORAGE_KEYS.recycled, recycledToSui);
    }, [recycledToSui, mounted]);

    useEffect(() => {
        if (!mounted) return;
        if (!hasHydrated.current) return;
        saveToStorage(STORAGE_KEYS.journal, journal);
    }, [journal, mounted]);

    // Dynamic Derived Values
    const cashBalance = assets.find(a => a.symbol === 'USD')?.currentValue || 0;
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    // Simulate Market Movement — allocation computed inside the updater to avoid stale closures
    useEffect(() => {
        const interval = setInterval(() => {
            setAssets(prev => {
                const updated = prev.map(asset => {
                    if (asset.symbol === 'USD') return asset;

                    const volatility = asset.symbol === 'SUI' ? 0.0005 : 0.001;
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
    }, []);

    // ─── Actions ───

    const recyclePnL = useCallback((symbol: string) => {
        setAssets(prev => {
            const assetIndex = prev.findIndex(a => a.symbol === symbol);
            const suiIndex = prev.findIndex(a => a.symbol === 'SUI');
            if (assetIndex === -1 || suiIndex === -1) return prev;

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

            const sui = newAssets[suiIndex];
            newAssets[suiIndex] = {
                ...sui,
                units: sui.units + (profit / sui.currentPrice),
                currentValue: sui.currentValue + profit,
                totalCost: (sui.totalCost || 0) + profit
            };

            setRecycledToSui(curr => curr + profit);
            return newAssets;
        });
    }, []);

    const killOrder = useCallback((id: string) => {
        setPendingOrders(prev => prev.filter(o => o.id !== id));
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
        setAssets(PORTFOLIO_DATA.assets);
        setPendingOrders(PORTFOLIO_DATA.pendingOrders);
        setRecycledToSui(PORTFOLIO_DATA.recycledToSui || 0);
        setJournal([]);
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }, []);

    const exportData = useCallback(() => {
        return JSON.stringify({ assets, pendingOrders, recycledToSui, journal }, null, 2);
    }, [assets, pendingOrders, recycledToSui, journal]);

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
