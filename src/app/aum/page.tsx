"use client";
import React, { useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { ACCOUNTS, AccountId, LOGO_MAPPING, Asset } from '@/data/portfolio';
import { TRADE_FEE_PERCENT, getCashHealth, STRATEGIES } from '@/data/strategy';
import PriceTicker from '@/components/PriceTicker';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtPercent = (n: number) => n.toFixed(2) + '%';

// ─── Sparkline ───
function Sparkline({ data, color }: { data: number[]; color: string }) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 100;
    const height = 20;
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((d - min) / range) * height,
    }));
    const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    return (
        <svg width={width} height={height} className="overflow-visible">
            <path d={path} fill="none" stroke={color === 'red' ? '#fb7185' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${path} L ${width},${height} L 0,${height} Z`} fill={`url(#grad-aum-${color})`} opacity="0.1" />
            <defs>
                <linearGradient id={`grad-aum-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color === 'red' ? '#fb7185' : '#10b981'} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
}

function Metric({ label, value, color, trend, chart }: { label: string; value: string | number; color?: string; trend?: string; chart?: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 p-5 rounded-xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent hover:from-white/15 transition-all duration-300 relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${color?.includes('green') || color?.includes('emerald') ? 'bg-green-500' : color?.includes('red') || color?.includes('rose') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <span className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold flex justify-between items-center z-10">
                {label}
                {trend && <span className={`text-[10px] ${trend.startsWith('+') ? 'text-green-400' : trend.startsWith('⚠') ? 'text-rose-400' : 'text-gray-400'}`}>{trend}</span>}
            </span>
            <div className="flex items-end justify-between z-10">
                <span className={`text-2xl font-mono font-bold tracking-tight ${color || 'text-white'}`}>{value}</span>
                {chart}
            </div>
            {!chart && (
                <div className="h-1 w-full bg-white/5 mt-2 rounded overflow-hidden">
                    <div className={`h-full w-2/3 ${color?.includes('red') || color?.includes('rose') ? 'bg-red-500' : 'bg-emerald-500'} opacity-50`}></div>
                </div>
            )}
        </div>
    );
}

export default function AUMDashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [syncTime, setSyncTime] = React.useState('');
    const { assets, activeAccount, pendingOrders } = usePortfolio();

    React.useEffect(() => {
        setMounted(true);
        setSyncTime(new Date().toLocaleTimeString());
    }, []);

    // ─── Merge both accounts ───
    const otherAccountId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
    const otherAssets = ACCOUNTS[otherAccountId].assets;

    const activeTotal = assets.reduce((s, a) => s + a.currentValue, 0);
    const otherTotal = otherAssets.reduce((s, a) => s + a.currentValue, 0);
    const combinedTotal = activeTotal + otherTotal;

    // Combine positions — merge same symbols across accounts
    const mergedPositions = useMemo(() => {
        const map = new Map<string, {
            symbol: string;
            currentValue: number;
            currentPrice: number;
            totalCost: number;
            gainLoss: number;
            units: number;
            accounts: string[];
        }>();

        const process = (assetList: Asset[], acctLabel: string) => {
            assetList.forEach(a => {
                const existing = map.get(a.symbol);
                if (existing) {
                    existing.currentValue += a.currentValue;
                    existing.totalCost += a.totalCost || 0;
                    existing.gainLoss += a.gainLoss || 0;
                    existing.units += a.units;
                    if (!existing.accounts.includes(acctLabel)) existing.accounts.push(acctLabel);
                } else {
                    map.set(a.symbol, {
                        symbol: a.symbol,
                        currentValue: a.currentValue,
                        currentPrice: a.currentPrice,
                        totalCost: a.totalCost || 0,
                        gainLoss: a.gainLoss || 0,
                        units: a.units,
                        accounts: [acctLabel],
                    });
                }
            });
        };

        process(assets, activeAccount === 'sui' ? 'SUI' : 'ALTS');
        process(otherAssets, otherAccountId === 'sui' ? 'SUI' : 'ALTS');

        return [...map.values()]
            .map(p => ({ ...p, allocation: (p.currentValue / combinedTotal) * 100 }))
            .sort((a, b) => b.currentValue - a.currentValue);
    }, [assets, otherAssets, combinedTotal, activeAccount, otherAccountId]);

    const totalCash = mergedPositions.find(p => p.symbol === 'USD')?.currentValue || 0;
    const cashPercent = (totalCash / combinedTotal) * 100;
    const totalGainLoss = mergedPositions.filter(p => p.symbol !== 'USD').reduce((s, p) => s + p.gainLoss, 0);
    const totalCost = mergedPositions.filter(p => p.symbol !== 'USD').reduce((s, p) => s + p.totalCost, 0);
    const pnlPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100) : 0;
    const coins = mergedPositions.filter(p => p.symbol !== 'USD');
    const positionCount = coins.length;
    const largestPosition = coins[0];

    // Pending orders across both accounts
    const allPendingOrders = useMemo(() => {
        const activeOrders = pendingOrders.map(o => ({ ...o, account: activeAccount }));
        const otherOrders = ACCOUNTS[otherAccountId].pendingOrders.map(o => ({ ...o, account: otherAccountId }));

        // De-dupe by ID (priority to active account)
        const combined = [...activeOrders, ...otherOrders];
        const uniqueMap = new Map();
        combined.forEach(o => {
            if (!uniqueMap.has(o.id)) uniqueMap.set(o.id, o);
        });

        return Array.from(uniqueMap.values());
    }, [pendingOrders, activeAccount, otherAccountId]);

    const totalStagedValue = allPendingOrders.reduce((s, o) => s + o.units * o.price, 0);

    if (!mounted) return null;

    return (
        <>
            {/* Dynamic Background Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 text-white">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/40 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/30 blur-[150px] rounded-full animate-pulse delay-1000"></div>
            </div>

            <header className="h-16 flex items-center justify-between px-4 pl-16 lg:pl-8 lg:px-8 glass-panel z-50 shrink-0 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
                    <span className="text-lg">💰</span>
                    <span className="text-sm font-black text-white uppercase tracking-widest">Combined AUM</span>
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">CROSS-ACCOUNT VIEW</span>
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <span className="text-[10px] font-mono text-gray-500 tracking-tighter lowercase opacity-50">
                        last_sync: {syncTime}
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">2 Roth IRAs</span>
                        <span className="text-[11px] font-mono text-gray-400">Tax-Free Gains</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth custom-scrollbar">
                {/* ═══ TOP METRICS ROW ═══ */}
                <section className="animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Metric
                            label="Combined AUM"
                            value={currency.format(combinedTotal)}
                            color="text-white"
                            chart={<Sparkline data={[combinedTotal - 200, combinedTotal - 100, combinedTotal - 150, combinedTotal - 50, combinedTotal]} color="green" />}
                        />
                        <Metric
                            label="Combined PnL"
                            value={currency.format(totalGainLoss)}
                            color={totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                            trend={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}% ROI`}
                        />
                        <Metric
                            label="Total Positions"
                            value={`${positionCount} Coins`}
                            color="text-blue-400"
                            trend={largestPosition ? `Largest: ${largestPosition.symbol} @ ${largestPosition.allocation.toFixed(1)}%` : ''}
                        />
                        <Metric
                            label="Combined Cash"
                            value={currency.format(totalCash)}
                            color={cashPercent < 10 ? 'text-rose-400' : cashPercent < 20 ? 'text-amber-400' : 'text-emerald-400'}
                            trend={`${cashPercent.toFixed(1)}% of AUM`}
                        />
                        <Metric
                            label="Staged Orders"
                            value={`${allPendingOrders.length} Orders`}
                            color="text-purple-400"
                            trend={totalStagedValue > 0 ? `${currency.format(totalStagedValue)} value` : 'No orders staged'}
                        />
                    </div>
                </section>

                {/* Global Market Pulse */}
                <section className="animate-fade-in-up delay-75">
                    <PriceTicker />
                </section>

                {/* ═══ ACCOUNT BREAKDOWN ═══ */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up delay-100">
                    {([activeAccount, otherAccountId] as AccountId[])
                        .sort((a, b) => {
                            const valA = a === activeAccount ? activeTotal : otherTotal;
                            const valB = b === activeAccount ? activeTotal : otherTotal;
                            return valB - valA;
                        })
                        .map(accId => {
                            const acctAssets = accId === activeAccount ? assets : otherAssets;
                            const acctTotal = accId === activeAccount ? activeTotal : otherTotal;
                            const acctStrategy = STRATEGIES[accId];
                            const acctCoins = acctAssets.filter(a => a.symbol !== 'USD');
                            const acctCash = acctAssets.find(a => a.symbol === 'USD')?.currentValue || 0;
                            const acctCashPct = (acctCash / acctTotal) * 100;
                            const acctGainLoss = acctCoins.reduce((s, a) => s + (a.gainLoss || 0), 0);
                            const isActive = accId === activeAccount;
                            return (
                                <div key={accId} className={`glass-card p-6 space-y-4 ${isActive ? 'border-l-4 border-l-blue-500/50' : 'border-l-4 border-l-white/10'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{accId === 'sui' ? '👑' : '🔄'}</span>
                                            <div>
                                                <h3 className="text-sm font-black text-white">{ACCOUNTS[accId].accountName}</h3>
                                                <span className="text-[9px] text-gray-500 font-mono">{acctStrategy.name} • {ACCOUNTS[accId].accountNumber}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-black font-mono text-white">{currency.format(acctTotal)}</div>
                                            <span className="text-[9px] text-gray-500 font-mono">{((acctTotal / combinedTotal) * 100).toFixed(1)}% of AUM</span>
                                        </div>
                                    </div>

                                    {/* Mini stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[8px] text-gray-600 uppercase tracking-wider">PnL</span>
                                            <div className={`text-sm font-black font-mono ${acctGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {acctGainLoss >= 0 ? '+' : ''}{currency.format(acctGainLoss)}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[8px] text-gray-600 uppercase tracking-wider">Cash</span>
                                            <div className={`text-sm font-black font-mono ${acctCashPct < 10 ? 'text-rose-400' : 'text-white'}`}>
                                                {acctCashPct.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[8px] text-gray-600 uppercase tracking-wider">Positions</span>
                                            <div className="text-sm font-black font-mono text-white">{acctCoins.length}</div>
                                        </div>
                                    </div>

                                    {/* Top holdings */}
                                    <div className="space-y-1.5">
                                        {acctCoins.sort((a, b) => b.currentValue - a.currentValue).slice(0, 5).map(a => (
                                            <div key={a.symbol} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-all">
                                                <div className="flex items-center gap-2">
                                                    {LOGO_MAPPING[a.symbol] && <img src={LOGO_MAPPING[a.symbol]} alt="" className="w-4 h-4" />}
                                                    <span className="text-[11px] font-bold text-white">{a.symbol}</span>
                                                    <span className="text-[9px] text-gray-600 font-mono">{a.allocation.toFixed(1)}%</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-mono ${(a.gainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {(a.gainLoss || 0) >= 0 ? '+' : ''}{currency.format(a.gainLoss || 0)}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-white font-bold">{currency.format(a.currentValue)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                </section>

                {/* ═══ MERGED POSITIONS LEDGER ═══ */}
                <section className="glass-card p-0 overflow-hidden animate-fade-in-up delay-150">
                    <div className="p-6 pb-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">All Positions (Merged)</h3>
                            <span className="text-[9px] text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {coins.length} unique assets across 2 accounts
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Asset</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Accounts</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Units</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Spot Price</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Value</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Alloc</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Cost</th>
                                    <th className="p-4 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">PnL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {coins.map(p => {
                                    const roi = p.totalCost > 0 ? ((p.gainLoss / p.totalCost) * 100) : 0;
                                    return (
                                        <tr key={p.symbol} className="hover:bg-white/[0.03] transition-all">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2.5">
                                                    {LOGO_MAPPING[p.symbol] && <img src={LOGO_MAPPING[p.symbol]} alt="" className="w-5 h-5" />}
                                                    <span className="text-sm font-black text-white">{p.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    {p.accounts.map(a => (
                                                        <span key={a} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${a === 'SUI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-xs font-mono text-gray-300">{p.units.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                            <td className="p-4 text-right text-xs font-mono text-blue-400">{currency.format(p.currentPrice)}</td>
                                            <td className="p-4 text-right text-xs font-mono text-white font-bold">{currency.format(p.currentValue)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${Math.min(p.allocation, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-mono text-gray-400 w-12 text-right">{p.allocation.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-xs font-mono text-gray-500">{currency.format(p.totalCost)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-xs font-mono font-bold ${p.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {p.gainLoss >= 0 ? '+' : ''}{currency.format(p.gainLoss)}
                                                    </span>
                                                    <span className={`text-[9px] font-mono ${roi >= 0 ? 'text-emerald-400/60' : 'text-rose-400/60'}`}>
                                                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* ═══ CROSS-ACCOUNT ORDER BOOK ═══ */}
                {allPendingOrders.length > 0 && (
                    <section className="glass-card p-6 space-y-4 animate-fade-in-up delay-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">All Pending Orders</h3>
                            <span className="text-[9px] text-gray-600 font-mono">{allPendingOrders.length} orders • {currency.format(totalStagedValue)} staged</span>
                        </div>
                        <div className="space-y-2">
                            {allPendingOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${order.account === 'sui' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                            {order.account === 'sui' ? 'SUI' : 'ALTS'}
                                        </span>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${order.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                            {order.type}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {LOGO_MAPPING[order.symbol] && <img src={LOGO_MAPPING[order.symbol]} alt="" className="w-4 h-4" />}
                                            <span className="text-xs font-bold text-white">{order.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-mono">
                                        <span className="text-gray-400">{order.units} @ {currency.format(order.price)}</span>
                                        <span className="text-white font-bold">{currency.format(order.units * order.price)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="h-10"></div>
            </main>
        </>
    );
}
