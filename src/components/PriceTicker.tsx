"use client";
import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';

export default function PriceTicker() {
    const { assets } = usePortfolio();
    const prices = assets.filter(a => a.symbol !== 'USD').map(a => ({
        symbol: a.symbol,
        price: a.currentPrice,
        change: ((a.currentPrice - (a.avgCost || a.currentPrice)) / (a.avgCost || a.currentPrice)) * 100
    }));

    return (
        <div className="w-full bg-white/[0.02] border-y border-white/5 py-2 overflow-hidden flex items-center">
            <div className="flex animate-infinite-scroll gap-12 whitespace-nowrap px-6">
                {prices.concat(prices).map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.symbol}</span>
                        <span className="text-xs font-mono font-bold text-white">${p.price.toFixed(4)}</span>
                        <span className={`text-[10px] font-mono ${p.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {p.change >= 0 ? '▲' : '▼'} {Math.abs(p.change).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
