"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { ACCOUNTS, AccountId, LOGO_MAPPING } from '@/data/portfolio';
import { TRADE_FEE_PERCENT } from '@/data/strategy';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function RiskGuardPage() {
    const { assets, activeAccount, activeStrategy, pendingOrders, mounted } = usePortfolio();
    const [stressPercent, setStressPercent] = useState(-30);
    const [stressSymbol, setStressSymbol] = useState('ALL');
    const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
    const [simulateFills, setSimulateFills] = useState(false);
    const [mounted2, setMounted2] = useState(false);

    useEffect(() => setMounted2(true), []);
    // Reset simulation on account switch
    useEffect(() => { setCustomPrices({}); setSimulateFills(false); }, [activeAccount]);

    const copyToClipboard = (txt: string | number) => {
        if (!txt) return;
        navigator.clipboard.writeText(String(txt));
    };

    // ─── Simulation Engine ───
    const simulatedData = useMemo(() => {
        // 1. Apply Price Overrides
        let currentAssets = assets.map(a => {
            const price = customPrices[a.symbol] ?? a.currentPrice;
            const val = price * a.units;
            return { ...a, currentPrice: price, currentValue: val, isSimulated: customPrices[a.symbol] !== undefined };
        });

        // 2. Apply Pending Fills (if enabled)
        if (simulateFills) {
            let cash = currentAssets.find(a => a.symbol === 'USD')?.currentValue || 0;
            const assetMap = new Map(currentAssets.map(a => [a.symbol, a]));

            pendingOrders.forEach(order => {
                const asset = assetMap.get(order.symbol);
                const gross = order.units * order.price; // execute at limit price
                const fee = gross * (TRADE_FEE_PERCENT / 100);

                if (order.type === 'buy') {
                    // Decrease Cash
                    cash -= (gross + fee);
                    // Increase Asset
                    if (asset) {
                        const newUnits = asset.units + order.units;
                        const newVal = newUnits * asset.currentPrice; // value at *current/simulated* price
                        assetMap.set(order.symbol, { ...asset, units: newUnits, currentValue: newVal });
                    }
                } else {
                    // Sell
                    // Increase Cash
                    cash += (gross - fee);
                    // Decrease Asset
                    if (asset) {
                        const newUnits = Math.max(0, asset.units - order.units);
                        const newVal = newUnits * asset.currentPrice;
                        assetMap.set(order.symbol, { ...asset, units: newUnits, currentValue: newVal });
                    }
                }
            });

            // Update assets list with modified values
            currentAssets = Array.from(assetMap.values());
            // Update Cash asset
            const cashIndex = currentAssets.findIndex(a => a.symbol === 'USD');
            if (cashIndex !== -1) currentAssets[cashIndex] = { ...currentAssets[cashIndex], currentValue: cash, units: cash };
        }

        const total = currentAssets.reduce((s, a) => s + a.currentValue, 0);
        return {
            totalValue: total,
            assets: currentAssets.map(a => ({ ...a, allocation: total > 0 ? (a.currentValue / total) * 100 : 0 }))
        };
    }, [assets, customPrices, simulateFills, pendingOrders, activeAccount]);

    const { assets: simulatedAssets, totalValue } = simulatedData;
    const coins = simulatedAssets.filter(a => a.symbol !== 'USD');
    const cashAsset = simulatedAssets.find(a => a.symbol === 'USD');

    // ─── Rebalance Logic (Smart) ───
    const rebalanceSuggestions = useMemo(() => {
        return coins.map(a => {
            const range = activeStrategy.targets[a.symbol.toLowerCase() as 'sui' | 'alts'] || activeStrategy.targets.alts; // fallback
            // Note: Strategy targets are complex, simplified here to use asset-level targetAllocation which comes from portfolio.ts
            // We use the asset's targetAllocation as the source of truth for the dashboard to match the bar charts.

            const targetValue = totalValue * (a.targetAllocation / 100);
            const diff = targetValue - a.currentValue; // Positive = Buy, Negative = Sell
            const absDiff = Math.abs(diff);
            const neededChange = diff; // $ amount

            // Pending Order Awareness
            const pendingBuys = pendingOrders.filter(o => o.symbol === a.symbol && o.type === 'buy');
            const pendingSells = pendingOrders.filter(o => o.symbol === a.symbol && o.type === 'sell');
            const pendingBuyVal = pendingBuys.reduce((s, o) => s + (o.units * o.price), 0);
            const pendingSellVal = pendingSells.reduce((s, o) => s + (o.units * o.price), 0);

            let action = 'HOLD';
            let status = ' actionable';
            let remainingVal = absDiff;
            let coverMsg = '';

            // Thresholds ($10 noise filter due to simulation)
            if (diff < -10) {
                action = 'TRIM';
                if (pendingSellVal >= absDiff * 0.9) {
                    status = 'COVERED';
                    const coveringOrder = pendingSells.sort((a, b) => b.price - a.price)[0]; // highest sell
                    coverMsg = `Covered by pending sell (${coveringOrder?.units.toFixed(0)} @ ${coveringOrder?.price})`;
                } else if (pendingSellVal > 0) {
                    status = 'PARTIAL';
                    remainingVal = absDiff - pendingSellVal;
                    coverMsg = `Partially covered ($${pendingSellVal.toFixed(0)} pending)`;
                }
            } else if (diff > 10) {
                action = 'ADD';
                if (pendingBuyVal >= absDiff * 0.9) {
                    status = 'COVERED';
                    const coveringOrder = pendingBuys.sort((a, b) => a.price - b.price)[0]; // lowest buy
                    coverMsg = `Covered by pending buy (${coveringOrder?.units.toFixed(0)} @ ${coveringOrder?.price})`;
                } else if (pendingBuyVal > 0) {
                    status = 'PARTIAL';
                    remainingVal = absDiff - pendingBuyVal;
                    coverMsg = `Partially covered ($${pendingBuyVal.toFixed(0)} pending)`;
                }
            }

            return {
                ...a, targetValue, diff, absDiff, neededChange, action, status, remainingVal, coverMsg,
                tradeUnitsApprox: Math.abs(remainingVal / a.currentPrice)
            };
        }).filter(a => a.action !== 'HOLD').sort((a, b) => b.absDiff - a.absDiff);
    }, [coins, totalValue, pendingOrders, activeStrategy]);


    // ─── Stress Test Logic ───
    const stressResults = useMemo(() => {
        const pct = stressPercent / 100;
        return simulatedAssets.map(a => {
            if (a.symbol === 'USD') return { ...a, stressedValue: a.currentValue, delta: 0, stressedAlloc: 0 };
            const applies = stressSymbol === 'ALL' || stressSymbol === a.symbol;
            const stressedValue = applies ? a.currentValue * (1 + pct) : a.currentValue;
            const delta = stressedValue - a.currentValue;
            return { ...a, stressedValue, delta, stressedAlloc: 0 };
        });
    }, [simulatedAssets, stressPercent, stressSymbol]);

    const stressedTotal = stressResults.reduce((s, a) => s + a.stressedValue, 0);
    const stressedWithAlloc = stressResults.map(a => ({ ...a, stressedAlloc: (a.stressedValue / stressedTotal) * 100 }));
    const totalDelta = stressedTotal - totalValue;

    // ─── Concentration & Drawdown ───
    const sortedByAlloc = [...coins].sort((a, b) => b.allocation - a.allocation);
    const herfindahl = coins.reduce((s, a) => s + Math.pow(a.allocation / 100, 2), 0);
    const effectivePositions = 1 / (herfindahl || 1);

    const drawdowns = coins.map(a => {
        const costBasis = a.avgCost || a.currentPrice;
        const drawdownPct = ((a.currentPrice - costBasis) / costBasis) * 100;
        return { ...a, drawdownPct, costBasis };
    }).sort((a, b) => a.drawdownPct - b.drawdownPct);

    // ─── Cross-account Risk ───
    const otherAccountId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
    const otherAssets = ACCOUNTS[otherAccountId].assets;
    const otherTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
    const combinedTotal = totalValue + otherTotal;
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
                    <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        HHI: {(herfindahl * 10000).toFixed(0)} • Eff. Pos: {effectivePositions.toFixed(1)}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSimulateFills(!simulateFills)}
                        className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border transition-all flex items-center gap-2 ${simulateFills ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                    >
                        {simulateFills ? 'Disable Fills' : 'Simulate Fills'}
                    </button>
                    {Object.keys(customPrices).length > 0 && (
                        <button onClick={() => setCustomPrices({})} className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-all">
                            Reset Prices
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                {/* ═══ SCENARIO SIMULATOR ═══ */}
                <div className="glass-card p-6 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔮</div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Scenario Simulator</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {coins.map(a => (
                            <div key={a.symbol} className="space-y-1">
                                <div className="flex justify-between items-center text-[9px]">
                                    <span className="text-gray-500 font-bold">{a.symbol} Price</span>
                                    {a.isSimulated && <span className="text-amber-400">Modified</span>}
                                </div>
                                <input
                                    type="number"
                                    value={a.currentPrice}
                                    onChange={(e) => setCustomPrices(prev => ({ ...prev, [a.symbol]: parseFloat(e.target.value) || 0 }))}
                                    step="0.0001"
                                    className={`w-full bg-white/5 border rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-blue-500/50 ${a.isSimulated ? 'border-amber-500/30 text-amber-300' : 'border-white/10 text-white'}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ STRATEGY REBALANCER ═══ */}
                {rebalanceSuggestions.length > 0 && (
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Strategy Rebalancer
                                <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[9px]">Fee Aware</span>
                            </h3>
                            <span className="text-[9px] text-gray-600 font-mono">Based on target allocations</span>
                        </div>

                        <div className="space-y-3">
                            {rebalanceSuggestions.map(a => {
                                const isTrim = a.action === 'TRIM';
                                const isCovered = a.status === 'COVERED';
                                const colorClass = isTrim ? 'rose' : 'emerald';

                                return (
                                    <div key={a.symbol} className={`p-4 rounded-xl border transition-all ${isTrim ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'} ${isCovered ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isTrim ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                    {isCovered ? '✓' : (isTrim ? '↓' : '↑')}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-white">{a.symbol}</span>
                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${isTrim ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                            {a.action}
                                                        </span>
                                                        {a.status !== 'actionable' && (
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase bg-white/5 px-1.5 rounded">
                                                                {a.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-mono">
                                                        {a.allocation.toFixed(1)}% → {a.targetAllocation.toFixed(1)}% target
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {!isCovered ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => copyToClipboard(a.tradeUnitsApprox.toFixed(a.currentPrice < 1 ? 0 : 4))}
                                                                className={`text-sm font-black font-mono hover:underline ${isTrim ? 'text-rose-400' : 'text-emerald-400'}`}
                                                                title="Click to copy units"
                                                            >
                                                                {isTrim ? 'Sell' : 'Buy'} {a.tradeUnitsApprox.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                            </button>
                                                        </div>
                                                        <span className="text-[9px] text-gray-500 font-mono">
                                                            ≈ {currency.format(a.remainingVal)}
                                                            <span className="text-amber-500/70 ml-1">(fee: {currency.format(a.remainingVal * TRADE_FEE_PERCENT / 100)})</span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-mono text-emerald-400">{a.coverMsg}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
                                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all border ${stressPercent === pct ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                                    >{pct > 0 ? '+' : ''}{pct}%</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Base Value</span>
                            <div className="text-lg font-black font-mono text-white">{currency.format(totalValue)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Post-Stress</span>
                            <div className={`text-lg font-black font-mono ${totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currency.format(stressedTotal)}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <span className="text-[9px] text-gray-600 uppercase tracking-widest">Impact</span>
                            <div className={`text-lg font-black font-mono ${totalDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {totalDelta >= 0 ? '+' : ''}{currency.format(totalDelta)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
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
                                ⚠️ Cross-account overlap: <span className="font-bold">{overlapping.join(', ')}</span> — held in both accounts
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
                                            <div className="h-full bg-emerald-500/60 rounded-full transition-all" style={{ width: `${Math.min(Math.abs(a.drawdownPct), 100)}%` }}></div>
                                        ) : (
                                            <div className="h-full bg-rose-500/60 rounded-full transition-all" style={{ width: `${Math.min(Math.abs(a.drawdownPct), 100)}%` }}></div>
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

                {/* ═══ CROSS-ACCOUNT SUMMARY ═══ */}
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
