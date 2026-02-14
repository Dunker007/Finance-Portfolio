"use client";
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { ACCOUNTS, AccountId, LOGO_MAPPING } from '@/data/portfolio';
import { TRADE_FEE_PERCENT } from '@/data/strategy';


const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function RiskGuardPage() {
    const { assets, activeAccount, activeStrategy, pendingOrders, mounted } = usePortfolio();
    const [stressPercent, setStressPercent] = useState(-30);
    const [stressSymbol, setStressSymbol] = useState('ALL');
    const [mounted2, setMounted2] = useState(false);
    React.useEffect(() => setMounted2(true), []);

    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const coins = assets.filter(a => a.symbol !== 'USD');
    const cashAsset = assets.find(a => a.symbol === 'USD');

    // ─── Stress Test ───
    const stressResults = useMemo(() => {
        const pct = stressPercent / 100;
        return assets.map(a => {
            if (a.symbol === 'USD') return { ...a, stressedValue: a.currentValue, delta: 0, stressedAlloc: 0 };
            const applies = stressSymbol === 'ALL' || stressSymbol === a.symbol;
            const stressedValue = applies ? a.currentValue * (1 + pct) : a.currentValue;
            const delta = stressedValue - a.currentValue;
            return { ...a, stressedValue, delta, stressedAlloc: 0 };
        });
    }, [assets, stressPercent, stressSymbol]);

    const stressedTotal = stressResults.reduce((s, a) => s + a.stressedValue, 0);
    const stressedWithAlloc = stressResults.map(a => ({ ...a, stressedAlloc: (a.stressedValue / stressedTotal) * 100 }));
    const totalDelta = stressedTotal - totalValue;

    // ─── Concentration analysis ───
    const sortedByAlloc = [...coins].sort((a, b) => b.allocation - a.allocation);
    const herfindahl = coins.reduce((s, a) => s + Math.pow(a.allocation / 100, 2), 0);
    const effectivePositions = 1 / herfindahl;

    // ─── Drawdown from cost basis ───
    const drawdowns = coins.map(a => {
        const costBasis = a.avgCost || a.currentPrice;
        const drawdownPct = ((a.currentPrice - costBasis) / costBasis) * 100;
        return { ...a, drawdownPct, costBasis };
    }).sort((a, b) => a.drawdownPct - b.drawdownPct);

    // ─── Rebalance suggestions ───
    const rebalanceSuggestions = coins.map(a => {
        const deviation = a.allocation - a.targetAllocation;
        const targetValue = (a.targetAllocation / 100) * totalValue;
        const neededChange = targetValue - a.currentValue;
        const action = deviation > 3 ? 'TRIM' : deviation < -3 ? 'ADD' : 'HOLD';
        return { ...a, deviation, targetValue, neededChange, action };
    }).filter(a => a.action !== 'HOLD').sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

    // ─── Cross-account risk ───
    const otherAccountId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
    const otherAssets = ACCOUNTS[otherAccountId].assets;
    const otherTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
    const combinedTotal = totalValue + otherTotal;

    // Find overlapping symbols
    const activeSymbols = new Set(coins.map(a => a.symbol));
    const otherSymbols = new Set(otherAssets.filter(a => a.symbol !== 'USD').map(a => a.symbol));
    const overlapping = [...activeSymbols].filter(s => otherSymbols.has(s));

    if (!mounted || !mounted2) return null;

    return (
        <>
            <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-30 sticky top-0">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🛡️</span>
                    <h1 className="text-sm font-black text-white uppercase tracking-widest">Risk Guard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        HHI: {(herfindahl * 10000).toFixed(0)} • Effective Positions: {effectivePositions.toFixed(1)}
                    </span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* ═══ STRESS TEST ═══ */}
                <div className="glass-card p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Stress Test
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <select value={stressSymbol} onChange={e => setStressSymbol(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white font-mono outline-none"
                            >
                                <option value="ALL" className="bg-black">All Coins</option>
                                {coins.map(c => <option key={c.symbol} value={c.symbol} className="bg-black">{c.symbol}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                                {[-50, -30, -20, -10, 10, 20, 50].map(pct => (
                                    <button key={pct} onClick={() => setStressPercent(pct)}
                                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all border ${stressPercent === pct ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                                            }`}
                                    >{pct > 0 ? '+' : ''}{pct}%</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stress impact header */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Current Portfolio</span>
                            <div className="text-lg font-black font-mono text-white">{currency.format(totalValue)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">After {stressPercent > 0 ? '+' : ''}{stressPercent}% Scenario</span>
                            <div className={`text-lg font-black font-mono ${totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currency.format(stressedTotal)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Impact</span>
                            <div className={`text-lg font-black font-mono ${totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {totalDelta >= 0 ? '+' : ''}{currency.format(totalDelta)}
                            </div>
                        </div>
                    </div>

                    {/* Per-asset stress */}
                    <div className="space-y-2">
                        {stressedWithAlloc.filter(a => a.symbol !== 'USD').map(a => (
                            <div key={a.symbol} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.01] border border-white/5">
                                <div className="flex items-center gap-2 w-24">
                                    {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt={a.symbol} className="w-5 h-5" />}
                                    <span className="text-xs font-black text-white">{a.symbol}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${a.delta >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${Math.min(a.stressedAlloc, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400 w-12 text-right">{a.stressedAlloc.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end w-28">
                                    <span className="text-xs font-mono text-white">{currency.format(a.stressedValue)}</span>
                                    <span className={`text-[9px] font-mono ${a.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {a.delta >= 0 ? '+' : ''}{currency.format(a.delta)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ═══ CONCENTRATION HEATMAP ═══ */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Concentration Map</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {sortedByAlloc.map(a => {
                                const intensity = Math.min(a.allocation / 50, 1);
                                const isOverweight = a.allocation > a.targetAllocation + 5;
                                const isUnderweight = a.allocation < a.targetAllocation - 5;
                                return (
                                    <div key={a.symbol}
                                        className={`p-3 rounded-xl border transition-all ${isOverweight ? 'border-amber-500/30 bg-amber-500/10' :
                                            isUnderweight ? 'border-blue-500/30 bg-blue-500/10' :
                                                'border-white/5 bg-white/[0.02]'
                                            }`}
                                        style={{ opacity: 0.4 + intensity * 0.6 }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5">
                                                {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-4 h-4" />}
                                                <span className="text-[10px] font-black text-white">{a.symbol}</span>
                                            </div>
                                            {isOverweight && <span className="text-[8px] text-amber-400">OVER</span>}
                                            {isUnderweight && <span className="text-[8px] text-blue-400">UNDER</span>}
                                        </div>
                                        <div className="text-sm font-black font-mono text-white">{a.allocation.toFixed(1)}%</div>
                                        <div className="text-[9px] text-gray-600 font-mono">target: {a.targetAllocation.toFixed(1)}%</div>
                                    </div>
                                );
                            })}
                        </div>

                        {overlapping.length > 0 && (
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[9px] text-amber-400">
                                ⚠️ Cross-account overlap: <span className="font-bold">{overlapping.join(', ')}</span> — held in both SUI and Alts accounts
                            </div>
                        )}
                    </div>

                    {/* ═══ DRAWDOWN TRACKER ═══ */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Drawdown from Cost Basis</h3>
                        <div className="space-y-3">
                            {drawdowns.map(a => (
                                <div key={a.symbol} className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 w-20">
                                        {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-4 h-4" />}
                                        <span className="text-[10px] font-bold text-white">{a.symbol}</span>
                                    </div>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                                        {a.drawdownPct >= 0 ? (
                                            <div className="h-full bg-emerald-500/60 rounded-full transition-all"
                                                style={{ width: `${Math.min(Math.abs(a.drawdownPct), 100)}%` }}
                                            ></div>
                                        ) : (
                                            <div className="h-full bg-rose-500/60 rounded-full transition-all"
                                                style={{ width: `${Math.min(Math.abs(a.drawdownPct), 100)}%` }}
                                            ></div>
                                        )}
                                    </div>
                                    <span className={`text-xs font-mono font-bold w-16 text-right ${a.drawdownPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {a.drawdownPct >= 0 ? '+' : ''}{a.drawdownPct.toFixed(1)}%
                                    </span>
                                    <span className="text-[9px] text-gray-600 font-mono w-16 text-right">{currency.format(a.gainLoss || 0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ REBALANCE SUGGESTIONS ═══ */}
                {rebalanceSuggestions.length > 0 && (
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Rebalance Suggestions</h3>
                        <div className="space-y-3">
                            {rebalanceSuggestions.map(a => {
                                const isTrim = a.action === 'TRIM';
                                return (
                                    <div key={a.symbol} className={`p-4 rounded-xl border ${isTrim ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isTrim ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                    {isTrim ? '↓' : '↑'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-4 h-4" />}
                                                        <span className="text-sm font-black text-white">{a.symbol}</span>
                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${isTrim ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                            {a.action}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-mono">
                                                        {a.allocation.toFixed(1)}% → {a.targetAllocation.toFixed(1)}% target
                                                        {' '}({a.deviation > 0 ? '+' : ''}{a.deviation.toFixed(1)}% deviation)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-black font-mono ${isTrim ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {isTrim ? 'Sell' : 'Buy'} ~{currency.format(Math.abs(a.neededChange))}
                                                </span>
                                                <div className="text-[9px] text-amber-400 font-mono">
                                                    fee: ~{currency.format(Math.abs(a.neededChange) * TRADE_FEE_PERCENT / 100)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══ CROSS-ACCOUNT EXPOSURE ═══ */}
                <div className="glass-card p-6 space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cross-Account Risk Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase">Active ({activeAccount.toUpperCase()})</span>
                            <div className="text-base font-black font-mono text-white">{currency.format(totalValue)}</div>
                            <span className="text-[9px] text-gray-500">{((totalValue / combinedTotal) * 100).toFixed(0)}% of combined</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase">Other ({otherAccountId.toUpperCase()})</span>
                            <div className="text-base font-black font-mono text-gray-400">{currency.format(otherTotal)}</div>
                            <span className="text-[9px] text-gray-500">{((otherTotal / combinedTotal) * 100).toFixed(0)}% of combined</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase">Combined AUM</span>
                            <div className="text-base font-black font-mono text-blue-400">{currency.format(combinedTotal)}</div>
                            <span className="text-[9px] text-gray-500">Across 2 Roth IRAs</span>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
