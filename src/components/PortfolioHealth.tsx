"use client";
import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { STRATEGY, getSuiHealth, getCashHealth } from '../data/strategy';

export default function PortfolioHealth() {
    const { assets } = usePortfolio();
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

    const suiPercent = assets.find(a => a.symbol === 'SUI')?.allocation || 0;
    const cashPercent = assets.find(a => a.symbol === 'USD')?.allocation || 0;
    const altPercent = 100 - suiPercent - cashPercent;

    const suiHealth = getSuiHealth(suiPercent);
    const cashHealth = getCashHealth(cashPercent);
    const altTarget = STRATEGY.targets.alts.max;
    const altHealth = altPercent > altTarget + 5 ? 'OVER' : altPercent < altTarget - 10 ? 'UNDER' : 'ON_TARGET';

    const getHealthColor = (h: string) => {
        if (h === 'CRITICAL') return { bar: 'bg-rose-500', text: 'text-rose-400', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]', label: '⚠ CRITICAL' };
        if (h === 'UNDER') return { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]', label: 'UNDER' };
        if (h === 'OVER') return { bar: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.3)]', label: 'OVER' };
        return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]', label: 'ON TARGET' };
    };

    const gauges = [
        {
            label: 'SUI Anchor',
            current: suiPercent,
            target: STRATEGY.targets.sui.ideal,
            health: suiHealth,
            icon: '👑',
        },
        {
            label: 'Alt Exposure',
            current: altPercent,
            target: altTarget,
            health: altHealth,
            icon: '🔄',
        },
        {
            label: 'Cash Reserve',
            current: cashPercent,
            target: STRATEGY.targets.cash.ideal,
            health: cashHealth,
            icon: '🛡️',
        },
    ];

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Portfolio Health
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>
                <span className="text-[10px] text-gray-600 font-mono">vs {STRATEGY.targetMask}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {gauges.map(g => {
                    const styles = getHealthColor(g.health);
                    const deviation = g.current - g.target;
                    const deviationSign = deviation >= 0 ? '+' : '';

                    return (
                        <div key={g.label} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                            {/* Background glow */}
                            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${styles.bar}`}></div>

                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">{g.icon}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{g.label}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>
                                    {styles.label}
                                </span>
                            </div>

                            <div className="flex items-end justify-between mb-2 relative z-10">
                                <span className="text-2xl font-black font-mono text-white">{g.current.toFixed(1)}%</span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-gray-600 font-mono">Target: {g.target}%</span>
                                    <span className={`text-[10px] font-mono font-bold ${styles.text}`}>
                                        {deviationSign}{deviation.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                                <div
                                    className={`h-full ${styles.bar} ${styles.glow} transition-all duration-1000 rounded-full`}
                                    style={{ width: `${Math.min(g.current, 100)}%` }}
                                ></div>
                                {/* Target marker */}
                                <div
                                    className="absolute top-0 h-full w-0.5 bg-white/30"
                                    style={{ left: `${g.target}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
