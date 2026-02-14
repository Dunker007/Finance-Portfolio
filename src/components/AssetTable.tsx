"use client";
import React, { useState, useRef, useCallback } from 'react';
import { LOGO_MAPPING } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { TRADE_FEE_PERCENT } from '../data/strategy';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtPercent = (n: number) => n.toFixed(2) + '%';

export default function AssetTable() {
    const { assets, pendingOrders, fillOrder, killOrder, activeAccount, activeStrategy } = usePortfolio();
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

    const getStrategyBadge = (symbol: string) => {
        if (symbol === 'USD') return { label: 'Safety Net', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
        if (activeAccount === 'sui' && symbol === 'SUI') return { label: 'Anchor / King', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
        if (activeAccount === 'alts') return { label: 'Balanced Alt', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
        return { label: 'Tactical Swing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    };

    const sortedAssets = [...assets].sort((a, b) => b.currentValue - a.currentValue);


    return (
        <div className="w-full h-full flex flex-col">
            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Global Positions Portfolio</h3>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 font-mono">Strategy: {activeStrategy.name.split('—')[0].trim()}</span>
                    <span className="text-[9px] text-amber-400/60 font-mono border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
                        {TRADE_FEE_PERCENT}% per trade
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">Click any row for details</span>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-8">Asset</th>
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Balance</th>
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Cost Basis</th>
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Market Price</th>
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">PnL</th>
                            <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right pr-8">Allocation</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedAssets.map((asset) => {
                            const logoUrl = asset.logo || LOGO_MAPPING[asset.symbol];
                            const badge = getStrategyBadge(asset.symbol);
                            const isAnchor = activeAccount === 'sui' && asset.symbol === 'SUI';
                            const pnlPercent = asset.totalCost && asset.totalCost > 0 ? ((asset.gainLoss || 0) / asset.totalCost) * 100 : 0;
                            const showTakeProfit = asset.symbol !== 'USD' && pnlPercent >= 25;
                            const overConcentrated = activeAccount === 'alts' && asset.symbol !== 'USD' && asset.allocation > activeStrategy.thresholds.maxConcentration;
                            const isExpanded = expandedSymbol === asset.symbol;
                            const symbolOrders = pendingOrders.filter(o => o.symbol === asset.symbol);
                            const isClickable = asset.symbol !== 'USD';

                            return (
                                <React.Fragment key={asset.symbol}>
                                    <tr
                                        onClick={() => isClickable && setExpandedSymbol(isExpanded ? null : asset.symbol)}
                                        className={`group transition-all duration-300 ${isClickable ? 'cursor-pointer' : ''} ${isAnchor ? 'bg-blue-500/[0.02] border-l-2 border-l-blue-500' : ''} ${overConcentrated ? 'bg-rose-500/[0.02]' : ''} ${isExpanded ? 'bg-blue-500/[0.04]' : 'hover:bg-white/[0.04]'}`}
                                    >
                                        <td className="p-4 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt={asset.symbol} className="w-6 h-6 object-contain" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white">{asset.symbol[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-white">{asset.symbol}</span>
                                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${badge.color} uppercase tracking-tighter`}>{badge.label}</span>
                                                        {symbolOrders.length > 0 && (
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                                {symbolOrders.length} order{symbolOrders.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {overConcentrated && (
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse">
                                                                OVER {activeStrategy.thresholds.maxConcentration}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 font-medium uppercase tracking-tight">{asset.name}</span>
                                                </div>
                                                {isClickable && (
                                                    <span className={`text-[10px] text-gray-600 ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-gray-200">{asset.units.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-500 font-mono italic">{currency.format(asset.currentValue)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-mono text-gray-400">{asset.avgCost ? currency.format(asset.avgCost) : '—'}</span>
                                                <span className="text-[9px] text-gray-700 font-mono">{asset.totalCost ? currency.format(asset.totalCost) : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-mono font-bold text-blue-400">{currency.format(asset.currentPrice)}</span>
                                                <span className="text-[9px] text-gray-700 uppercase">Per Unit</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {showTakeProfit && (
                                                    <span
                                                        className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-tighter"
                                                        title={`+${pnlPercent.toFixed(0)}% — Consider taking profit`}
                                                    >
                                                        💰 Take Profit?
                                                    </span>
                                                )}
                                                <div className={`flex flex-col items-end ${(asset.gainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    <span className="text-xs font-mono font-bold">
                                                        {(asset.gainLoss || 0) >= 0 ? '+' : ''}{currency.format(asset.gainLoss || 0)}
                                                    </span>
                                                    <span className="text-[9px] opacity-70">
                                                        {asset.totalCost ? (((asset.gainLoss || 0) / asset.totalCost) * 100).toFixed(1) + '%' : '0%'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-8">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-white">{fmtPercent(asset.allocation)}</span>
                                                <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden relative">
                                                    <div
                                                        className={`h-full ${isAnchor ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-500'}`}
                                                        style={{ width: `${asset.allocation}%` }}
                                                    ></div>
                                                    <div className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: `${asset.targetAllocation}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ═══ Expanded Detail Panel ═══ */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <PositionDetail
                                                    asset={asset}
                                                    orders={symbolOrders}
                                                    fillOrder={fillOrder}
                                                    killOrder={killOrder}
                                                    currentCashPercent={(assets.find(a => a.symbol === 'USD')?.allocation || 0)}
                                                    activeAccount={activeAccount}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// POSITION DETAIL PANEL — inline expanded view
// ═══════════════════════════════════════════════════
interface PositionDetailProps {
    asset: {
        symbol: string;
        name: string;
        currentPrice: number;
        currentValue: number;
        units: number;
        avgCost: number | null;
        totalCost: number | null;
        gainLoss: number | null;
        allocation: number;
        targetAllocation: number;
    };
    orders: { id: string; symbol: string; type: string; units: number; price: number; note?: string }[];
    fillOrder: (id: string) => void;
    killOrder: (id: string) => void;
    currentCashPercent: number;
    activeAccount: string;
}

function PositionDetail({ asset, orders, fillOrder, killOrder, currentCashPercent, activeAccount }: PositionDetailProps) {
    const buys = orders.filter(o => o.type === 'buy');
    const sells = orders.filter(o => o.type === 'sell');

    return (
        <div className="bg-gradient-to-b from-blue-900/10 to-transparent border-t border-blue-500/10 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/5">

                {/* ── Left: Position Stats ── */}
                <div className="lg:col-span-3 p-6 space-y-4">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Position Summary
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    </h4>

                    <div className="space-y-3">
                        <StatRow label="Holdings" value={`${asset.units.toLocaleString()} units`} />
                        <StatRow label="Market Value" value={currency.format(asset.currentValue)} />
                        <StatRow label="Avg Cost" value={asset.avgCost ? currency.format(asset.avgCost) : '—'} />
                        <StatRow label="Total Cost" value={asset.totalCost ? currency.format(asset.totalCost) : '—'} />
                        <StatRow
                            label="Unrealized PnL"
                            value={`${(asset.gainLoss || 0) >= 0 ? '+' : ''}${currency.format(asset.gainLoss || 0)}`}
                            color={(asset.gainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                        />
                        <StatRow
                            label="ROI"
                            value={asset.totalCost ? `${(((asset.gainLoss || 0) / asset.totalCost) * 100).toFixed(1)}%` : '—'}
                            color={(asset.gainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                        />

                        <div className="pt-2 border-t border-white/5">
                            <StatRow label="Allocation" value={fmtPercent(asset.allocation)} />
                            <StatRow label="Target" value={fmtPercent(asset.targetAllocation)} />
                            <StatRow
                                label="Deviation"
                                value={`${(asset.allocation - asset.targetAllocation) >= 0 ? '+' : ''}${(asset.allocation - asset.targetAllocation).toFixed(1)}%`}
                                color={(asset.allocation - asset.targetAllocation) > 5 ? 'text-amber-400' : 'text-gray-400'}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Center: Orders ── */}
                <div className="lg:col-span-5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Active Orders ({orders.length})
                        </h4>
                        <div className="flex items-center gap-3 text-[9px] font-mono">
                            {buys.length > 0 && <span className="text-emerald-400">{buys.length} buy{buys.length > 1 ? 's' : ''}</span>}
                            {sells.length > 0 && <span className="text-rose-400">{sells.length} sell{sells.length > 1 ? 's' : ''}</span>}
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 text-xs font-mono">No active orders for {asset.symbol}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
                            {orders.map(order => {
                                const isBuy = order.type === 'buy';
                                const fillValue = order.units * order.price;
                                const fee = fillValue * (TRADE_FEE_PERCENT / 100);
                                const net = isBuy ? fillValue + fee : fillValue - fee;
                                const distPercent = ((order.price - asset.currentPrice) / asset.currentPrice * 100);

                                return (
                                    <div key={order.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white ${isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                    {isBuy ? 'B' : 'S'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-white">{order.units.toLocaleString()} units</span>
                                                        <span className="text-[9px] font-mono text-blue-400">@ {currency.format(order.price)}</span>
                                                        <span className={`text-[8px] px-1 py-0.5 rounded border ${distPercent > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                            {distPercent >= 0 ? '+' : ''}{distPercent.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px]">
                                                        <span className="text-gray-500">{currency.format(fillValue)}</span>
                                                        <span className="text-amber-500">fee: {currency.format(fee)}</span>
                                                        <span className="text-gray-400">net: {currency.format(net)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => fillOrder(order.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white text-[9px] font-black uppercase transition-all border border-blue-500/20"
                                                >
                                                    Fill
                                                </button>
                                                <button
                                                    onClick={() => killOrder(order.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[9px] font-black uppercase transition-all border border-red-500/20"
                                                >
                                                    Kill
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-1.5 text-[9px] text-gray-600 italic">&ldquo;{order.note}&rdquo;</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* What-if summary */}
                    {orders.length > 0 && (
                        <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 text-[9px] font-mono">
                            <span className="text-gray-500 uppercase tracking-widest font-black">If all fire: </span>
                            {buys.length > 0 && (
                                <span className="text-emerald-400 mr-3">
                                    Buy {currency.format(buys.reduce((s, o) => s + o.units * o.price, 0))}
                                    <span className="text-amber-500 ml-1">(+{currency.format(buys.reduce((s, o) => s + o.units * o.price, 0) * TRADE_FEE_PERCENT / 100)} fees)</span>
                                </span>
                            )}
                            {sells.length > 0 && (
                                <span className="text-rose-400">
                                    Sell {currency.format(sells.reduce((s, o) => s + o.units * o.price, 0))}
                                    <span className="text-amber-500 ml-1">(-{currency.format(sells.reduce((s, o) => s + o.units * o.price, 0) * TRADE_FEE_PERCENT / 100)} fees)</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right: Mini AI Chat ── */}
                <div className="lg:col-span-4 p-6">
                    <MiniAIChat symbol={asset.symbol} asset={asset} activeAccount={activeAccount} currentCashPercent={currentCashPercent} />
                </div>
            </div>
        </div>
    );
}

// ─── Stat Row ───
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
            <span className={`text-xs font-mono font-bold ${color || 'text-white'}`}>{value}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MINI AI CHAT — focused on a single position
// ═══════════════════════════════════════════════════
function MiniAIChat({ symbol, asset, activeAccount, currentCashPercent }: {
    symbol: string;
    asset: PositionDetailProps['asset'];
    activeAccount: string;
    currentCashPercent: number;
}) {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
        { role: 'ai', text: generateInitialBrief(symbol, asset, activeAccount, currentCashPercent) }
    ]);
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const handleSend = useCallback(() => {
        if (!query.trim()) return;
        const q = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', text: q }]);
        setTyping(true);

        setTimeout(() => {
            const response = generatePositionResponse(q.toLowerCase(), symbol, asset, activeAccount, currentCashPercent);
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
            setTyping(false);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 600 + Math.random() * 500);
    }, [query, symbol, asset, activeAccount, currentCashPercent]);

    return (
        <div className="flex flex-col h-full">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                AI on {symbol}
                <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 text-[8px]">FOCUSED</span>
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2 mb-3 custom-scrollbar max-h-[240px]">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-600/20 text-blue-200 border border-blue-500/20'
                            : 'bg-white/5 text-gray-300 border border-white/5'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="flex justify-start">
                        <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-500 animate-pulse">
                            Analyzing {symbol}...
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="flex gap-1.5">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={`Ask about ${symbol}...`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all"
                />
                <button onClick={handleSend} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all">
                    Ask
                </button>
            </div>
        </div>
    );
}

// ─── AI Response Generation ───

function generateInitialBrief(symbol: string, asset: PositionDetailProps['asset'], account: string, cashPercent: number): string {
    const pnl = asset.gainLoss || 0;
    const pnlDir = pnl >= 0 ? 'green' : 'red';
    const roi = asset.totalCost ? ((pnl / asset.totalCost) * 100).toFixed(1) : '0';

    if (pnl >= 0) {
        return `${symbol} is ${pnlDir} at +${currency.format(pnl)} (${roi}% ROI). ${asset.allocation.toFixed(1)}% of portfolio. ${account === 'sui' ? 'Consider profit-taking if momentum fades.' : `Watch for 30-100% profit targets. Max ${20}% concentration.`}`;
    } else {
        return `${symbol} is ${pnlDir} at ${currency.format(pnl)} (${roi}% ROI). ${asset.allocation.toFixed(1)}% of portfolio. ${Math.abs(pnl) > 300 ? 'Significant drawdown — patience or average-down dip buys.' : 'Minor drawdown — hold and monitor.'} Cash at ${cashPercent.toFixed(0)}%.`;
    }
}

function generatePositionResponse(q: string, symbol: string, asset: PositionDetailProps['asset'], account: string, cashPercent: number): string {
    const pnl = asset.gainLoss || 0;
    const roi = asset.totalCost ? ((pnl / asset.totalCost) * 100).toFixed(1) : '0';

    if (q.includes('sell') || q.includes('exit') || q.includes('trim')) {
        if (pnl > 0) return `${symbol} is +${currency.format(pnl)} (${roi}%). Taking profit here nets ${currency.format(pnl * 0.99)} after 1% fee. ${cashPercent < 20 ? 'Cash is low — selling makes sense to rebuild reserves.' : 'Cash is healthy — only sell if momentum is fading.'}`;
        return `${symbol} is in the red at ${currency.format(pnl)}. Selling now locks in the loss. Unless you need to cut risk, patience is better. Wait for recovery.`;
    }
    if (q.includes('buy') || q.includes('add') || q.includes('more') || q.includes('dip')) {
        return `Averaging down on ${symbol} would lower your cost basis from ${asset.avgCost ? currency.format(asset.avgCost) : 'unknown'}. Cash at ${cashPercent.toFixed(0)}% — ${cashPercent < 20 ? 'tight. Only add if conviction is high.' : 'healthy. A small dip buy is viable.'} Remember: 1% fee on every trade.`;
    }
    if (q.includes('target') || q.includes('price')) {
        return `Current: ${currency.format(asset.currentPrice)}, avg cost: ${asset.avgCost ? currency.format(asset.avgCost) : '—'}. ${pnl > 0 ? `Already +${roi}%. ${account === 'alts' ? 'Strategy says 30-100% profit targets.' : 'Strategy says 20-50% profit targets.'}` : `Need ${currency.format(Math.abs(pnl))} recovery to break even.`}`;
    }
    if (q.includes('risk') || q.includes('concentration')) {
        return `${symbol} is ${asset.allocation.toFixed(1)}% of portfolio (target: ${asset.targetAllocation.toFixed(1)}%). ${asset.allocation > asset.targetAllocation + 5 ? 'Over-allocated — consider trimming.' : asset.allocation < asset.targetAllocation - 5 ? 'Under-allocated — room to add.' : 'Near target — balanced.'} ${account === 'alts' ? `Max concentration rule: 20%.` : ''}`;
    }

    return `${symbol}: ${currency.format(asset.currentValue)} value, ${asset.units.toLocaleString()} units at ${currency.format(asset.currentPrice)}. PnL: ${pnl >= 0 ? '+' : ''}${currency.format(pnl)} (${roi}%). Allocation: ${asset.allocation.toFixed(1)}% vs ${asset.targetAllocation.toFixed(1)}% target. Ask about sell, buy, targets, or risk.`;
}
