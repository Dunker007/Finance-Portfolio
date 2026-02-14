"use client";
import { usePortfolio } from '../context/PortfolioContext';
import { LOGO_MAPPING } from '../data/portfolio';

// Utility for formatting percentage
const fmt = (n: number) => n.toFixed(1) + '%';

const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function AllocationChart() {
    const { assets } = usePortfolio();

    // Sorting: SUI first, then biggest to smallest
    const sorted = [...assets].sort((a, b) => b.allocation - a.allocation);

    // Donut Chart Calculations (Base coordinates for viewBox)
    const baseSize = 200;
    const strokeWidth = 16;
    const center = baseSize / 2;
    const radius = (baseSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    const getColor = (symbol: string) => {
        switch (symbol) {
            case 'SUI': return 'stroke-blue-500';
            case 'USD': return 'stroke-amber-500';
            case 'LINK': return 'stroke-purple-600';
            case 'AAVE': return 'stroke-pink-500';
            case 'IMX': return 'stroke-emerald-500';
            default: return 'stroke-gray-500';
        }
    };

    const getBgColor = (symbol: string) => {
        switch (symbol) {
            case 'SUI': return 'bg-blue-500';
            case 'USD': return 'bg-amber-500';
            case 'LINK': return 'bg-purple-600';
            case 'AAVE': return 'bg-pink-500';
            case 'IMX': return 'bg-emerald-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    Allocation Monitor
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">Real-time Balance</span>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 py-4">
                {/* Responsive SVG Donut - Left Side */}
                <div className="relative w-full max-w-[280px] aspect-square flex-shrink-0">
                    <svg
                        viewBox={`0 0 ${baseSize} ${baseSize}`}
                        className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                    >
                        {/* Background Circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-white/5"
                        />
                        {/* Segments */}
                        {sorted.map((asset) => {
                            const percentage = asset.allocation / 100;
                            const strokeLength = percentage * circumference;
                            const offset = currentOffset;
                            currentOffset += strokeLength;

                            return (
                                <circle
                                    key={asset.symbol}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${strokeLength} ${circumference}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="round"
                                    className={`${getColor(asset.symbol)} transition-all duration-1000 ease-out`}
                                />
                            );
                        })}
                    </svg>

                    {/* Strategic Center Cluster */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">Strategy Weight</span>
                        <div className="flex flex-col -space-y-1">
                            <span className="text-5xl font-black font-mono text-white">{Math.round(sorted.find(a => a.symbol === 'SUI')?.allocation ?? 0)}%</span>
                            <span className="text-sm font-bold text-blue-500/80 uppercase tracking-tighter">SUI Anchor</span>
                        </div>
                    </div>
                </div>

                {/* Right Side Strategy Panel */}
                <div className="flex-1 flex flex-col h-full w-full">
                    {/* Strategy Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 w-full">
                        {sorted.map((asset) => {
                            const logoUrl = LOGO_MAPPING[asset.symbol];
                            const isKing = asset.symbol === 'SUI';
                            const isCash = asset.symbol === 'USD';

                            return (
                                <div key={asset.symbol} className={`flex items-center justify-between group border-b border-white/5 pb-3 ${isKing ? 'border-blue-500/30' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/5 p-1.5 border border-white/10 group-hover:border-white/30 transition-all">
                                                {logoUrl ? (
                                                    <img src={logoUrl} alt={asset.symbol} className="w-full h-full object-contain filter brightness-110" />
                                                ) : (
                                                    <span className="text-[9px] font-bold">{asset.symbol[0]}</span>
                                                )}
                                            </div>
                                            {isKing && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-black animate-pulse"></div>}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-black text-gray-200 group-hover:text-white transition-colors">{asset.symbol}</span>
                                                <span className={`text-[8px] px-1 rounded bg-white/5 border border-white/10 text-gray-500 uppercase font-mono`}>
                                                    {isKing ? 'Core' : isCash ? 'Safety' : 'Tactical'}
                                                </span>
                                            </div>
                                            <span className="text-[9px] text-gray-600 font-mono tracking-tighter">
                                                Goal: {fmt(asset.targetAllocation)} • {asset.allocation > asset.targetAllocation ? 'OVER' : 'UNDER'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-base font-black font-mono text-white tracking-tighter">{fmt(asset.allocation)}</span>
                                        <div className="flex items-center gap-1 text-[9px] font-mono">
                                            <span className={(asset.gainLoss || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                PnL: {currency.format(asset.gainLoss || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Operational Directive */}
                    <div className="mt-8">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500 font-black text-[10px] text-white">TASK 01</div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">Execute SUI Ladder</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed italic">
                                SUI is currently <span className="text-white font-bold">overweight by 32%</span>. Price is showing strength.
                                Laddering exits at $1.02 and $1.05 will recover <span className="text-emerald-400 font-bold">~$1,155 in liquidity</span> to satisfy the 25% cash buffer mandate.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

