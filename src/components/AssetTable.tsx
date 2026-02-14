"use client";
import React from 'react';
import { LOGO_MAPPING } from '../data/portfolio';
import { usePortfolio } from '../context/PortfolioContext';
import { TRADE_FEE_PERCENT } from '../data/strategy';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtPercent = (n: number) => n.toFixed(2) + '%';

export default function AssetTable() {
    const { assets, recyclePnL, activeAccount, activeStrategy } = usePortfolio();

    const getStrategyBadge = (symbol: string) => {
        if (symbol === 'USD') return { label: 'Safety Net', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
        if (activeAccount === 'sui' && symbol === 'SUI') return { label: 'Anchor / King', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
        if (activeAccount === 'alts') return { label: 'Balanced Alt', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
        return { label: 'Tactical Swing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    };

    const sortedAssets = [...assets].sort((a, b) => b.currentValue - a.currentValue);
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

    // Can recycle PnL only on SUI account (alts has no king)
    const canRecycle = activeAccount === 'sui';

    return (
        <div className="w-full h-full flex flex-col">
            <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Global Positions Portfolio</h3>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-600 font-mono">Strategy: {activeStrategy.name.split('—')[0].trim()}</span>
                    <span className="text-[9px] text-amber-400/60 font-mono border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded">
                        {TRADE_FEE_PERCENT}% per trade
                    </span>
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
                            const logoUrl = LOGO_MAPPING[asset.symbol];
                            const badge = getStrategyBadge(asset.symbol);
                            const isAnchor = activeAccount === 'sui' && asset.symbol === 'SUI';
                            const showRecycle = canRecycle && asset.symbol !== 'SUI' && asset.symbol !== 'USD' && (asset.gainLoss || 0) > 0;

                            // Concentration check for alts account
                            const overConcentrated = activeAccount === 'alts' && asset.symbol !== 'USD' && asset.allocation > activeStrategy.thresholds.maxConcentration;

                            return (
                                <tr key={asset.symbol} className={`group hover:bg-white/[0.04] transition-all duration-300 ${isAnchor ? 'bg-blue-500/[0.02] border-l-2 border-l-blue-500' : ''} ${overConcentrated ? 'bg-rose-500/[0.02]' : ''}`}>
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
                                                    {overConcentrated && (
                                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/20 uppercase tracking-tighter animate-pulse">
                                                            OVER {activeStrategy.thresholds.maxConcentration}%
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-tight">{asset.name}</span>
                                            </div>
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
                                            {showRecycle && (
                                                <button
                                                    onClick={() => recyclePnL(asset.symbol)}
                                                    className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded hover:bg-emerald-500 hover:text-black transition-all uppercase tracking-tighter animate-pulse"
                                                >
                                                    Recycle → SUI
                                                </button>
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
                                                {/* Target marker */}
                                                <div className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: `${asset.targetAllocation}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
