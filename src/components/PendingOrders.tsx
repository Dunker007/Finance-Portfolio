"use client";
import React, { useState } from 'react';
import { LOGO_MAPPING } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { TRADE_FEE_PERCENT } from '../data/strategy';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function PendingOrders() {
    const { pendingOrders, fillOrder, killOrder, assets, activeAccount, activeStrategy } = usePortfolio();
    const [showBuilder, setShowBuilder] = useState(false);
    const [view, setView] = useState<'orders' | 'whatif'>('orders');

    const buys = pendingOrders.filter(o => o.type === 'buy');
    const sells = pendingOrders.filter(o => o.type === 'sell');

    const totalBuyExposure = buys.reduce((s, o) => s + o.units * o.price, 0);
    const totalSellProceeds = sells.reduce((s, o) => s + o.units * o.price, 0);
    const totalBuyFees = totalBuyExposure * (TRADE_FEE_PERCENT / 100);
    const totalSellFees = totalSellProceeds * (TRADE_FEE_PERCENT / 100);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] rounded-lg p-0 relative overflow-hidden border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 z-10">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Active Strategy Log
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </h3>
                    <span className="text-[10px] text-gray-600 font-mono mt-1">
                        {pendingOrders.length} orders — {buys.length} buys / {sells.length} sells
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                        <button
                            onClick={() => setView('orders')}
                            className={`text-[9px] font-black uppercase px-3 py-1.5 transition-all ${view === 'orders' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            Orders
                        </button>
                        <button
                            onClick={() => setView('whatif')}
                            className={`text-[9px] font-black uppercase px-3 py-1.5 transition-all ${view === 'whatif' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                        >
                            What If
                        </button>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">Projected Inflow</div>
                        <div className="text-sm font-black font-mono text-white">{currency.format(totalSellProceeds)}</div>
                    </div>
                </div>
            </div>

            {view === 'orders' ? (
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 z-10 custom-scrollbar mt-2">
                    {pendingOrders.map((order) => {
                        const isBuy = order.type === 'buy';
                        const logoUrl = LOGO_MAPPING[order.symbol];
                        const fillValue = order.units * order.price;
                        const fee = fillValue * (TRADE_FEE_PERCENT / 100);
                        const net = isBuy ? fillValue + fee : fillValue - fee;

                        // Distance from current price
                        const currentAsset = assets.find(a => a.symbol === order.symbol);
                        const currentPrice = currentAsset?.currentPrice || order.price;
                        const distPercent = ((order.price - currentPrice) / currentPrice * 100);

                        return (
                            <div key={order.id} className={`group relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl p-4 transition-all duration-300`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt={order.symbol} className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <span className="text-xs font-bold text-white">{order.symbol[0]}</span>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-md border border-black flex items-center justify-center text-[8px] font-black text-white ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                {isBuy ? 'B' : 'S'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white tracking-tight">{order.symbol}</span>
                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${distPercent > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {distPercent >= 0 ? '+' : ''}{distPercent.toFixed(1)}% from spot
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                <span className="text-gray-300 font-bold">{order.units.toLocaleString()} units</span>
                                                <span>@</span>
                                                <span className="text-blue-400">{currency.format(order.price)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-black font-mono text-gray-200">{currency.format(fillValue)}</div>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-[9px] text-amber-400 font-mono">fee: {currency.format(fee)}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">net: {currency.format(net)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-white/[0.03] flex justify-between items-center text-[10px]">
                                    <span className="text-gray-500 italic opacity-80">&ldquo;{order.note}&rdquo;</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fillOrder(order.id)}
                                            className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/20"
                                        >
                                            Execute
                                        </button>
                                        <button
                                            onClick={() => killOrder(order.id)}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                                        >
                                            Kill
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ─── WHAT-IF VIEW ─── */
                <div className="flex-1 overflow-y-auto px-6 pb-6 z-10 custom-scrollbar mt-4 space-y-4">
                    <WhatIfScenario
                        label="If All Sells Fire"
                        icon="📈"
                        color="emerald"
                        orders={sells}
                        assets={assets}
                        fee={TRADE_FEE_PERCENT}
                        isSell
                    />
                    <WhatIfScenario
                        label="If All Buys Fire"
                        icon="📉"
                        color="blue"
                        orders={buys}
                        assets={assets}
                        fee={TRADE_FEE_PERCENT}
                        isSell={false}
                    />
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Fee Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-600 uppercase">Total Buy Fees</span>
                                <span className="text-sm font-black font-mono text-amber-400">{currency.format(totalBuyFees)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-600 uppercase">Total Sell Fees</span>
                                <span className="text-sm font-black font-mono text-amber-400">{currency.format(totalSellFees)}</span>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/5">
                            <span className="text-[9px] text-rose-400 font-mono">Combined fee drag: {currency.format(totalBuyFees + totalSellFees)} ({TRADE_FEE_PERCENT}% per trade)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── What-If Scenario Card ───
function WhatIfScenario({ label, icon, color, orders, assets, fee, isSell }: {
    label: string; icon: string; color: string; orders: typeof import('../data/portfolio').SUI_ACCOUNT_DATA.pendingOrders;
    assets: typeof import('../data/portfolio').SUI_ACCOUNT_DATA.assets;
    fee: number; isSell: boolean;
}) {
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const orderValue = orders.reduce((s, o) => s + o.units * o.price, 0);
    const fees = orderValue * (fee / 100);
    const netCashChange = isSell ? orderValue - fees : -(orderValue + fees);
    const newCash = (assets.find(a => a.symbol === 'USD')?.currentValue || 0) + netCashChange;
    const newTotal = totalValue + (isSell ? -fees : -fees); // Total stays ~same, just rebalanced, minus fees
    const newCashPercent = Math.max(0, (newCash / newTotal) * 100);

    // Unique affected symbols
    const symbols = [...new Set(orders.map(o => o.symbol))];

    return (
        <div className={`p-4 rounded-xl bg-${color}-500/5 border border-${color}-500/20`}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">{label}</span>
                <span className="text-[9px] text-gray-500 font-mono ml-auto">{orders.length} orders</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 uppercase">Gross Value</span>
                    <span className="text-sm font-black font-mono text-white">{currency.format(orderValue)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 uppercase">Fees ({fee}%)</span>
                    <span className="text-sm font-black font-mono text-amber-400">-{currency.format(fees)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-gray-600 uppercase">Cash After</span>
                    <span className={`text-sm font-black font-mono ${newCash > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currency.format(newCash)}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500">New Cash %:</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-${color}-500 transition-all rounded-full`} style={{ width: `${Math.min(newCashPercent, 100)}%` }}></div>
                </div>
                <span className="text-[10px] font-mono text-white font-bold">{newCashPercent.toFixed(1)}%</span>
            </div>
            <div className="mt-2 text-[9px] text-gray-600">
                Affects: {symbols.join(', ')}
            </div>
        </div>
    );
}
