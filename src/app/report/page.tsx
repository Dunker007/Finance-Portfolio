"use client";
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { ACCOUNTS, AccountId, LOGO_MAPPING } from '@/data/portfolio';
import { TRADE_FEE_PERCENT } from '@/data/strategy';
import { STRATEGIES } from '@/data/strategy';
import Sidebar from '@/components/Sidebar';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ReportPage() {
    const { assets, pendingOrders, activeAccount, activeStrategy, recycledToSui, mounted } = usePortfolio();
    const [mounted2, setMounted2] = useState(false);
    React.useEffect(() => setMounted2(true), []);

    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const coins = assets.filter(a => a.symbol !== 'USD');
    const cashAsset = assets.find(a => a.symbol === 'USD');
    const cashPercent = cashAsset ? (cashAsset.currentValue / totalValue) * 100 : 0;

    // ─── Strategy compliance ───
    const compliance = useMemo(() => {
        const targets = activeStrategy.targets;
        const checks: { label: string; target: string; actual: string; status: 'pass' | 'warn' | 'fail' }[] = [];

        // Cash check
        const cashMin = targets.cash.min || 10;
        const cashIdeal = targets.cash.ideal || 25;
        checks.push({
            label: 'Cash Reserve',
            target: `${cashMin}–${cashIdeal}%`,
            actual: `${cashPercent.toFixed(1)}%`,
            status: cashPercent >= cashMin ? (cashPercent >= cashIdeal * 0.8 ? 'pass' : 'warn') : 'fail',
        });

        if (activeAccount === 'sui') {
            // SUI anchor check
            const suiAlloc = assets.find(a => a.symbol === 'SUI')?.allocation || 0;
            const suiTarget = targets.sui;
            checks.push({
                label: 'SUI Anchor Weight',
                target: `${suiTarget.min}–${suiTarget.max}%`,
                actual: `${suiAlloc.toFixed(1)}%`,
                status: suiAlloc >= suiTarget.min! ? (suiAlloc <= suiTarget.max! ? 'pass' : 'warn') : 'fail',
            });

            // Alts check
            const altAlloc = coins.filter(a => a.symbol !== 'SUI').reduce((s, a) => s + a.allocation, 0);
            checks.push({
                label: 'Alt Exposure',
                target: `${targets.alts.min}–${targets.alts.max}%`,
                actual: `${altAlloc.toFixed(1)}%`,
                status: altAlloc <= targets.alts.max! ? 'pass' : 'warn',
            });
        } else {
            // Concentration check
            const maxAlloc = Math.max(...coins.map(a => a.allocation));
            const maxSymbol = coins.find(a => a.allocation === maxAlloc)?.symbol || '?';
            checks.push({
                label: `Max Concentration (${maxSymbol})`,
                target: `≤${activeStrategy.thresholds.maxConcentration}%`,
                actual: `${maxAlloc.toFixed(1)}%`,
                status: maxAlloc <= activeStrategy.thresholds.maxConcentration ? 'pass' : 'warn',
            });

            // Position count
            checks.push({
                label: 'Position Count',
                target: '4–8 alts',
                actual: `${coins.length} positions`,
                status: coins.length >= 4 && coins.length <= 8 ? 'pass' : 'warn',
            });
        }

        return checks;
    }, [assets, activeAccount, activeStrategy, cashPercent, coins]);

    const score = compliance.filter(c => c.status === 'pass').length / compliance.length * 100;

    // ─── Best / Worst performers ───
    const sorted = [...coins].sort((a, b) => (b.gainLoss || 0) - (a.gainLoss || 0));
    const bestPerformers = sorted.filter(a => (a.gainLoss || 0) > 0).slice(0, 3);
    const worstPerformers = sorted.filter(a => (a.gainLoss || 0) < 0).slice(-3).reverse();

    // ─── Fee drag estimate ───
    const totalFeeDrag = useMemo(() => {
        // Estimate fees from orders + past fills
        const orderFeeDrag = pendingOrders.reduce((s, o) => s + o.units * o.price * TRADE_FEE_PERCENT / 100, 0);
        return orderFeeDrag;
    }, [pendingOrders]);

    // ─── Cross-account summary ───
    const otherAccountId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
    const otherAssets = ACCOUNTS[otherAccountId].assets;
    const otherTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
    const combinedTotal = totalValue + otherTotal;
    const otherCoins = otherAssets.filter(a => a.symbol !== 'USD');

    // ─── Trade recommendations ───
    const recommendations = useMemo(() => {
        const recs: { icon: string; text: string; priority: 'high' | 'medium' | 'low' }[] = [];

        if (cashPercent < 10) {
            recs.push({ icon: '🚨', text: `Cash critically low at ${cashPercent.toFixed(1)}%. Sell positions to rebuild dry powder.`, priority: 'high' });
        } else if (cashPercent < 15) {
            recs.push({ icon: '⚠️', text: `Cash at ${cashPercent.toFixed(1)}% — below ideal. Monitor for opportunities to take profit.`, priority: 'medium' });
        }

        coins.forEach(a => {
            const roi = a.totalCost ? ((a.gainLoss || 0) / a.totalCost) * 100 : 0;
            if (roi > 50) recs.push({ icon: '💰', text: `${a.symbol} is +${roi.toFixed(0)}% ROI. Consider taking 25-50% profit.`, priority: 'medium' });
            if (roi < -30) recs.push({ icon: '📉', text: `${a.symbol} is ${roi.toFixed(0)}% ROI. Evaluate thesis — hold or cut losses.`, priority: 'medium' });
            if (a.allocation > a.targetAllocation + 10) recs.push({ icon: '⚖️', text: `${a.symbol} at ${a.allocation.toFixed(1)}% — significantly overweight (target: ${a.targetAllocation.toFixed(1)}%). Trim.`, priority: 'high' });
        });

        if (pendingOrders.length === 0) {
            recs.push({ icon: '📋', text: 'No pending orders. Use the Order Builder to stage entries or exits.', priority: 'low' });
        }

        return recs;
    }, [assets, cashPercent, coins, pendingOrders]);

    if (!mounted || !mounted2) return null;

    return (
        <>
            <Sidebar />
            <div className="flex-1 flex flex-col bg-[#050505] min-h-screen overflow-hidden ml-0 lg:ml-72">
                <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-30 sticky top-0">
                    <div className="flex items-center gap-3">
                        <span className="text-lg">📋</span>
                        <h1 className="text-sm font-black text-white uppercase tracking-widest">Portfolio Report</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            Generated {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* ═══ STRATEGY SCORECARD ═══ */}
                    <div className="glass-card p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Strategy Compliance</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-500 font-mono">{activeStrategy.name}</span>
                                <div className={`px-3 py-1 rounded-lg text-xs font-black ${score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        score >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}>
                                    {score.toFixed(0)}% Score
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {compliance.map((check, i) => (
                                <div key={i} className={`p-4 rounded-xl border ${check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        check.status === 'warn' ? 'bg-amber-500/5 border-amber-500/20' :
                                            'bg-rose-500/5 border-rose-500/20'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm">{check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '🚨'}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{check.label}</span>
                                    </div>
                                    <div className="text-base font-black font-mono text-white">{check.actual}</div>
                                    <div className="text-[9px] text-gray-600 font-mono mt-1">Target: {check.target}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ═══ BEST PERFORMERS ═══ */}
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">🏆 Best Performers</h3>
                            {bestPerformers.length > 0 ? bestPerformers.map((a, i) => (
                                <div key={a.symbol} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                        <div className="flex items-center gap-2">
                                            {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-5 h-5" />}
                                            <span className="text-sm font-black text-white">{a.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black font-mono text-emerald-400">+{currency.format(a.gainLoss || 0)}</span>
                                        <div className="text-[9px] text-gray-500 font-mono">{a.totalCost ? `+${(((a.gainLoss || 0) / a.totalCost) * 100).toFixed(1)}% ROI` : ''}</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-600 font-mono text-center py-4">No green positions</p>
                            )}
                        </div>

                        {/* ═══ WORST PERFORMERS ═══ */}
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em]">📉 Needs Attention</h3>
                            {worstPerformers.length > 0 ? worstPerformers.map(a => (
                                <div key={a.symbol} className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                                    <div className="flex items-center gap-2">
                                        {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-5 h-5" />}
                                        <span className="text-sm font-black text-white">{a.symbol}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black font-mono text-rose-400">{currency.format(a.gainLoss || 0)}</span>
                                        <div className="text-[9px] text-gray-500 font-mono">{a.totalCost ? `${(((a.gainLoss || 0) / a.totalCost) * 100).toFixed(1)}% ROI` : ''}</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-600 font-mono text-center py-4">All positions are green 🎉</p>
                            )}
                        </div>
                    </div>

                    {/* ═══ TRADE RECOMMENDATIONS ═══ */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">AI Recommendations</h3>
                        {recommendations.length > 0 ? (
                            <div className="space-y-3">
                                {recommendations.sort((a, b) => {
                                    const p = { high: 0, medium: 1, low: 2 };
                                    return p[a.priority] - p[b.priority];
                                }).map((rec, i) => (
                                    <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${rec.priority === 'high' ? 'bg-rose-500/5 border-rose-500/20' :
                                            rec.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/20' :
                                                'bg-white/[0.02] border-white/5'
                                        }`}>
                                        <span className="text-lg">{rec.icon}</span>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-300 leading-relaxed">{rec.text}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${rec.priority === 'high' ? 'text-rose-400 border-rose-500/30' :
                                                rec.priority === 'medium' ? 'text-amber-400 border-amber-500/30' :
                                                    'text-gray-500 border-white/10'
                                            }`}>{rec.priority}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-600 font-mono text-center py-4">Portfolio looks well-balanced. No action needed.</p>
                        )}
                    </div>

                    {/* ═══ CROSS-ACCOUNT SUMMARY ═══ */}
                    <div className="glass-card p-6 space-y-5">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Cross-Account Summary</h3>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Active account */}
                            <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{activeAccount === 'sui' ? '👑' : '🔄'}</span>
                                    <span className="text-xs font-black text-white uppercase">{ACCOUNTS[activeAccount].accountName}</span>
                                    <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">ACTIVE</span>
                                </div>
                                <div className="text-xl font-black font-mono text-white">{currency.format(totalValue)}</div>
                                <div className="space-y-1 text-[9px] text-gray-500 font-mono">
                                    <div>Strategy: {activeStrategy.name}</div>
                                    <div>Positions: {coins.length} coins + cash</div>
                                    <div>Pending orders: {pendingOrders.length}</div>
                                    <div>Cash: {cashPercent.toFixed(1)}%</div>
                                    {activeAccount === 'sui' && <div>Recycled to SUI: {currency.format(recycledToSui)}</div>}
                                </div>
                            </div>

                            {/* Other account */}
                            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{otherAccountId === 'sui' ? '👑' : '🔄'}</span>
                                    <span className="text-xs font-black text-gray-400 uppercase">{ACCOUNTS[otherAccountId].accountName}</span>
                                </div>
                                <div className="text-xl font-black font-mono text-gray-400">{currency.format(otherTotal)}</div>
                                <div className="space-y-1 text-[9px] text-gray-600 font-mono">
                                    <div>Strategy: {STRATEGIES[otherAccountId].name}</div>
                                    <div>Positions: {otherCoins.length} coins + cash</div>
                                    <div>Pending orders: {ACCOUNTS[otherAccountId].pendingOrders.length}</div>
                                    <div>Cash: {((otherAssets.find(a => a.symbol === 'USD')?.currentValue || 0) / otherTotal * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-600 uppercase tracking-widest">Combined AUM</span>
                                <span className="text-xl font-black font-mono text-blue-400">{currency.format(combinedTotal)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-gray-600 uppercase tracking-widest">Total Fee Drag (Pending)</span>
                                <span className="text-sm font-black font-mono text-amber-400">{currency.format(totalFeeDrag)}</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
