"use client";
import React, { useEffect, useRef } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';

// TradingView Widget Configuration
declare global {
    interface Window {
        TradingView: any;
    }
}

const REGIMES = [
    { id: 'accumulation', label: 'Accumulation', icon: '🧺', color: 'text-emerald-400', desc: 'Buy dips. Range-bound with upward bias.' },
    { id: 'bull', label: 'Risk On / Bull', icon: '🚀', color: 'text-blue-400', desc: 'Trend is your friend. Full allocation.' },
    { id: 'distribution', label: 'Profit Taking', icon: '💰', color: 'text-amber-400', desc: 'Sell strength. Wall St distribution likely.' },
    { id: 'bear', label: 'Risk Off / Bear', icon: '🛡️', color: 'text-rose-400', desc: 'Cash is king. Protect capital.' },
    { id: 'choppiness', label: 'Chop / Noise', icon: '🌊', color: 'text-gray-400', desc: 'Sideways volatility. Avoid over-trading.' },
] as const;

export default function MarketPage() {
    const { marketCondition, setMarketCondition } = usePortfolio();
    const container = useRef<HTMLDivElement>(null);

    // Initialize TradingView Widget
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => {
            if (window.TradingView && container.current) {
                new window.TradingView.widget({
                    "width": "100%",
                    "height": "100%",
                    "symbol": "COINBASE:BTCUSD",
                    "interval": "D",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "container_id": "tradingview_widget"
                });
            }
        };
        document.head.appendChild(script);
        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, []);

    return (
        <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
            {/* Header / Regime Selector */}
            <div className="flex flex-col lg:flex-row gap-6 shrink-0">
                <div className="glass-card p-6 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Market Regime</h2>
                            <p className="text-xs text-gray-400 font-mono mt-1">Manual Override: Define the current macro environment.</p>
                        </div>
                        <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-500 uppercase">
                            Global Signal
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {REGIMES.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => setMarketCondition(r.id)}
                                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${marketCondition === r.id
                                        ? `bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-[1.02]`
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <span className="text-2xl mb-2">{r.icon}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${r.color}`}>{r.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Active Regime Description */}
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Current Doctrine</span>
                        <span className="text-xs text-gray-300 font-mono">
                            {REGIMES.find(r => r.id === marketCondition)?.desc}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 glass-card p-0 overflow-hidden relative border border-white/10 rounded-2xl">
                <div id="tradingview_widget" ref={container} className="w-full h-full" />
                <div className="absolute top-4 right-4 z-10 pointer-events-none opacity-50">
                    <span className="text-[100px]">📉</span>
                </div>
            </div>
        </div>
    );
}
