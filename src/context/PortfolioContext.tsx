"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PORTFOLIO_DATA, Asset, Order } from '../data/portfolio';

interface PortfolioContextType {
    totalValue: number;
    cashBalance: number;
    assets: Asset[];
    pendingOrders: Order[];
    recycledToSui: number;
    marketTrends: Record<string, number[]>;
    recyclePnL: (symbol: string) => void;
    fillOrder: (orderId: string) => void;
    killOrder: (orderId: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<Asset[]>(PORTFOLIO_DATA.assets);
    const [pendingOrders, setPendingOrders] = useState<Order[]>(PORTFOLIO_DATA.pendingOrders);
    const [recycledToSui, setRecycledToSui] = useState(PORTFOLIO_DATA.recycledToSui || 0);
    const [marketTrends, setMarketTrends] = useState(PORTFOLIO_DATA.marketTrends);

    // Dynamic Derived Values
    const cashBalance = assets.find(a => a.symbol === 'USD')?.currentValue || 0;
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);

    // Simulate Market Movement (Deterministic but Local)
    useEffect(() => {
        const interval = setInterval(() => {
            setAssets(prev => prev.map(asset => {
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
                    allocation: (newValue / totalValue) * 100
                };
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, [totalValue]);

    const recyclePnL = useCallback((symbol: string) => {
        setAssets(prev => {
            const assetIndex = prev.findIndex(a => a.symbol === symbol);
            const suiIndex = prev.findIndex(a => a.symbol === 'SUI');
            if (assetIndex === -1 || suiIndex === -1) return prev;

            const asset = prev[assetIndex];
            const profit = Math.max(0, asset.gainLoss || 0);

            if (profit <= 0) return prev;

            const newAssets = [...prev];

            // Extract profit from Alt
            newAssets[assetIndex] = {
                ...asset,
                units: asset.units - (profit / asset.currentPrice),
                currentValue: asset.currentValue - profit,
                gainLoss: (asset.gainLoss || 0) - profit,
                totalCost: asset.totalCost || 0
            };

            // Inject into SUI
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
        setPendingOrders(prev => {
            const order = prev.find(o => o.id === id);
            if (!order) return prev;

            // Simple fill logic: move to assets or update units
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

            return prev.filter(o => o.id !== id);
        });
    }, []);

    return (
        <PortfolioContext.Provider value={{
            totalValue,
            cashBalance,
            assets,
            pendingOrders,
            recycledToSui,
            marketTrends,
            recyclePnL,
            fillOrder,
            killOrder
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
