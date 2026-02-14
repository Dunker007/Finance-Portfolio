"use client";
import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { STRATEGY, getCashHealth } from '../data/strategy';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
});

const easyFormat = (num: number, digits = 4) => num.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 2 });

const fmtPercent = (n: number) => n.toFixed(2) + '%';

const Metric = ({ label, value, color, icon, trend, chart }: { label: string; value: string | number; color?: string; icon?: React.ReactNode; trend?: string; chart?: React.ReactNode }) => (
    <div className="flex flex-col gap-1 p-5 rounded-xl border border-white/5 bg-gradient-to-br from-white/10 to-transparent hover:from-white/15 transition-all duration-300 relative overflow-hidden group">
        {/* Background Glow */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${color?.includes('green') ? 'bg-green-500' : color?.includes('red') ? 'bg-red-500' : 'bg-blue-500'}`}></div>

        <span className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold flex justify-between items-center z-10">
            {label}
            {trend && <span className={`text-[10px] ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{trend}</span>}
        </span>
        <div className="flex items-end justify-between z-10">
            <span className={`text-2xl font-mono font-bold tracking-tight ${color || 'text-white'}`}>{value}</span>
            {chart}
        </div>

        {/* Micro Chart Line (Simulated) */}
        {!chart && (
            <div className="h-1 w-full bg-white/5 mt-2 rounded overflow-hidden">
                <div className={`h-full w-2/3 ${color?.includes('red') ? 'bg-red-500' : 'bg-emerald-500'} opacity-50`}></div>
            </div>
        )}
    </div>
);

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const width = 100;
    const height = 20;
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((d - min) / range) * height
    }));
    const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path d={path} fill="none" stroke={color === 'red' ? '#fb7185' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${path} L ${width},${height} L 0,${height} Z`} fill={`url(#gradient-${color})`} opacity="0.1" />
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color === 'red' ? '#fb7185' : '#10b981'} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default function DetailedMetrics() {
    const { totalValue, cashBalance, assets, recycledToSui, marketTrends } = usePortfolio();

    // Calculate total gain/loss from assets minus their cost basis
    const totalGainLoss = assets.reduce((sum: number, a) => sum + (a.gainLoss || 0), 0);

    const suiAsset = assets.find(a => a.symbol === 'SUI');
    const pnlColor = totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400';
    const percentChange = ((totalGainLoss / (totalValue - totalGainLoss)) * 100).toFixed(2);
    const trendSign = Number(percentChange) >= 0 ? '+' : '';

    const cashTarget = STRATEGY.targets.cash.ideal;
    const currentCashPercent = (cashBalance / totalValue) * 100;
    const cashGap = cashTarget - currentCashPercent;
    const cashStatus = getCashHealth(currentCashPercent);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Metric
                label="Aggregate Portfolio Value"
                value={currency.format(totalValue)}
                color="text-white"
                trend="+3.4% (Spot Recovery)"
                chart={<Sparkline data={[totalValue - 100, totalValue - 50, totalValue - 80, totalValue - 20, totalValue]} color="green" />}
            />
            <Metric
                label="Strategy Alpha / PnL"
                value={currency.format(totalGainLoss)}
                color={pnlColor}
                trend={`${trendSign}${percentChange}% ROI`}
                chart={<Sparkline data={[-900, -880, -850, -820, -810]} color="green" />}
            />

            <Metric
                label="SUI King Dominance"
                value={fmtPercent(suiAsset?.allocation || 0)}
                color="text-blue-400"
                trend="ANCHOR STABLE"
                chart={<Sparkline data={marketTrends.SUI} color="green" />}
            />

            <Metric
                label="Recycled Alpha (Alts → SUI)"
                value={currency.format(recycledToSui)}
                color="text-purple-400"
                trend="COMPOUNDING EFFECT"
                chart={<Sparkline data={[100, 200, 350, 420, 450]} color="green" />}
            />

            <Metric
                label="Cash Reserve Gap"
                value={fmtPercent(currentCashPercent)}
                color={cashStatus === 'CRITICAL' ? 'text-rose-400' : cashStatus === 'UNDER' ? 'text-amber-400' : 'text-emerald-400'}
                trend={cashStatus === 'CRITICAL' ? `⚠ CRITICAL — needs ${cashGap.toFixed(0)}% to target` : `Needs ${cashGap.toFixed(1)}% to ${cashTarget}%`}
            />
        </div>
    );
}
