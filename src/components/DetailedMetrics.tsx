"use client";
import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const fmtPercent = (n: number) => n.toFixed(1) + '%';

// Reusable Metric Card
const Metric = ({
    label,
    value,
    subValue,
    color,
    progress,
    icon,
    onClick,
    className
}: {
    label: string;
    value: string;
    subValue?: string;
    color?: string;
    progress?: number;
    icon?: string;
    onClick?: () => void;
    className?: string;
}) => (
    <div
        onClick={onClick}
        className={`flex flex-col justify-between p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 transition-all duration-300 relative overflow-hidden group min-h-[100px] ${onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]' : ''} ${className || ''}`}
    >
        {/* Background Glow */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity ${color?.includes('rose') ? 'bg-rose-500' : color?.includes('emerald') ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

        <div className="flex justify-between items-start z-10 relative">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
            {icon && <span className="text-xl opacity-20 grayscale group-hover:grayscale-0 transition-all">{icon}</span>}
        </div>

        <div className="z-10 relative mt-2">
            <div className={`text-2xl font-black tracking-tight ${color || 'text-white'}`}>
                {value}
            </div>
            {subValue && <div className="text-[10px] font-mono text-gray-400 mt-0.5">{subValue}</div>}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
            <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3 overflow-hidden relative">
                <div
                    className={`h-full rounded-full ${color?.replace('text-', 'bg-') || 'bg-blue-500'} shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
            </div>
        )}
    </div>
);

export default function DetailedMetrics() {
    const { totalValue, assets, activeAccount, setTargetValue, targetValue } = usePortfolio();
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [customTarget, setCustomTarget] = useState(targetValue.toString());

    // 1. Total PnL
    const totalGainLoss = assets.reduce((sum, a) => sum + (a.gainLoss || 0), 0);
    const pnlColor = totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400';
    const percentChange = totalGainLoss !== 0 ? ((totalGainLoss / (totalValue - totalGainLoss)) * 100) : 0;
    const pnlSign = totalGainLoss >= 0 ? '+' : '';

    // 2. Moon Goal Calculations
    // Note: targetValue comes from context now
    const effectiveTarget = targetValue || (activeAccount === 'sui' ? 35000 : 200000);
    const moonProgress = (totalValue / effectiveTarget) * 100;
    const multipleToGo = (effectiveTarget / totalValue).toFixed(1);

    // 3. Anchor / Conviction Metric
    let specificMetric = { label: 'SUI Dominance', value: '0%', sub: 'Target 60%', color: 'text-blue-400' };
    if (activeAccount === 'sui') {
        const sui = assets.find(a => a.symbol === 'SUI');
        specificMetric = {
            label: 'SUI ANCHOR',
            value: fmtPercent(sui?.allocation || 0),
            sub: 'Target 50-60%',
            color: (sui?.allocation || 0) > 60 ? 'text-amber-400' : 'text-blue-400'
        };
    } else {
        const topAsset = assets.reduce((prev, current) => (prev.allocation > current.allocation) ? prev : current, assets[0]);
        specificMetric = {
            label: 'TOP CONVICTION',
            value: topAsset ? topAsset.symbol : 'None',
            sub: `${fmtPercent(topAsset?.allocation || 0)} alloc`,
            color: 'text-purple-400'
        };
    }

    // 4. Cash / Dry Powder
    const cash = assets.find(a => a.symbol === 'USD')?.currentValue || 0;
    const cashAlloc = (cash / totalValue) * 100;

    // Scenarios
    const SCENARIOS = activeAccount === 'sui' ? [
        { label: 'Realistic (3x)', val: 10800, desc: 'Doable. $3 SUI.' },
        { label: 'Moderate (5x)', val: 18000, desc: 'Solid Cycle. $5 SUI.' },
        { label: 'Moonshot (10x)', val: 35000, desc: 'Cycle Peak. $10 SUI.' },
    ] : [
        { label: 'Realistic (2x)', val: 28000, desc: 'Conservative Alts run.' },
        { label: 'Moderate (5x)', val: 70000, desc: 'Standard Cycle Alts.' },
        { label: 'Moonshot (15x)', val: 200000, desc: 'Mania Phase Peak.' },
    ];

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Card 1: Net Worth */}
                <Metric
                    label="Net Worth"
                    value={currency.format(totalValue)}
                    subValue={activeAccount === 'sui' ? '#82367' : '#82263'}
                    color="text-white"
                />

                {/* Card 2: PnL */}
                <Metric
                    label="Total PnL"
                    value={currency.format(totalGainLoss)}
                    subValue={`${pnlSign}${percentChange.toFixed(2)}% ROI`}
                    color={pnlColor}
                />

                {/* Card 3: Strategy Specific */}
                <Metric
                    label={specificMetric.label}
                    value={specificMetric.value}
                    subValue={specificMetric.sub}
                    color={specificMetric.color}
                />

                {/* Card 4: Dry Powder */}
                <Metric
                    label="Dry Powder"
                    value={fmtPercent(cashAlloc)}
                    subValue={currency.format(cash)}
                    color={cashAlloc < 10 ? 'text-rose-400' : 'text-emerald-400'}
                    progress={cashAlloc} // Visualizing cash %
                />

                {/* Card 5: Moon Target (Interactive) */}
                <Metric
                    label="2026 Target"
                    value={currency.format(effectiveTarget)}
                    subValue={`${multipleToGo}x to Goal (Click to Set)`}
                    color={activeAccount === 'sui' ? 'text-amber-400' : 'text-cyan-400'}
                    progress={moonProgress}
                    icon="🚀"
                    onClick={() => setShowTargetModal(true)}
                    className="border-white/20 bg-white/[0.03]"
                />
            </div>

            {/* Target Selector Modal */}
            {showTargetModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-[#0b0e11] flex flex-col p-6 rounded-2xl border border-white/10 animate-fade-in-up shadow-2xl relative">
                        <button onClick={() => setShowTargetModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                        <div className="text-center mb-6">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">Set 2026 Goal</h3>
                            <p className="text-xs text-gray-400">Choose a scenario or set a custom target.</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {SCENARIOS.map((s) => (
                                <button
                                    key={s.label}
                                    onClick={() => { setTargetValue(s.val); setShowTargetModal(false); }}
                                    className={`w-full p-4 rounded-xl border flex items-center justify-between group transition-all ${targetValue === s.val
                                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500/50'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="text-left">
                                        <div className={`text-xs font-black uppercase tracking-widest ${targetValue === s.val ? 'text-blue-400' : 'text-gray-300'}`}>
                                            {s.label}
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">{s.desc}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black font-mono text-white">{currency.format(s.val)}</div>
                                        <div className="text-[10px] font-mono text-gray-500">{(s.val / totalValue).toFixed(1)}x from here</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/10 focus-within:border-blue-500/50 transition-colors">
                            <span className="text-xs font-bold text-gray-500 px-2">CUSTOM</span>
                            <span className="text-white">$</span>
                            <input
                                type="number"
                                value={customTarget}
                                onChange={e => setCustomTarget(e.target.value)}
                                className="bg-transparent flex-1 outline-none text-white font-mono text-sm"
                                placeholder="Enter amount..."
                            />
                            <button
                                onClick={() => { setTargetValue(Number(customTarget)); setShowTargetModal(false); }}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all"
                            >
                                Set
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
