"use client";
import React from 'react';
import { LOGO_MAPPING } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function PendingOrders() {
    const { pendingOrders, fillOrder, killOrder } = usePortfolio();

    const projectedLiquidity = pendingOrders
        .filter(o => o.type === 'sell' && o.symbol === 'SUI')
        .reduce((acc, curr) => acc + (curr.units * curr.price), 0);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] rounded-lg p-0 relative overflow-hidden border border-white/5">
            <div className="flex items-center justify-between mb-2 px-6 pt-6 z-10">
                <div className="flex flex-col">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Active Strategy Log
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </h3>
                    <span className="text-[10px] text-gray-600 font-mono mt-1">Status: Monitoring Momentum</span>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">Projected Inflow</div>
                    <div className="text-lg font-black font-mono text-white">{currency.format(projectedLiquidity)}</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 z-10 custom-scrollbar mt-4">
                {pendingOrders.map((order) => {
                    const isBuy = order.type === 'buy';
                    const isLadder = order.id.includes('ladder');
                    const logoUrl = LOGO_MAPPING[order.symbol];
                    const fillValue = order.units * order.price;

                    return (
                        <div key={order.id} className={`group relative bg-white/[0.01] hover:bg-white/[0.03] border ${isLadder ? 'border-blue-500/20 bg-blue-500/[0.02]' : 'border-white/5'} rounded-xl p-4 transition-all duration-300`}>
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
                                            {isLadder && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">Strategically Laddered</span>}
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
                                    <div className="flex items-center gap-1.5 justify-end mt-1">
                                        <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Awaiting Fill</span>
                                    </div>
                                </div>
                            </div>

                            {/* Note Section */}
                            <div className="mt-3 pt-3 border-t border-white/[0.03] flex justify-between items-center text-[10px]">
                                <span className="text-gray-500 italic opacity-80">"{order.note}"</span>
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
        </div>
    );
}
