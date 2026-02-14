"use client";
import { usePortfolio } from '../context/PortfolioContext';
import { LOGO_MAPPING } from '../data/portfolio';

const fmt = (n: number) => n.toFixed(1) + '%';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// Extended color palette for more coins
const COLOR_MAP: Record<string, { stroke: string; bg: string }> = {
    SUI: { stroke: 'stroke-blue-500', bg: 'bg-blue-500' },
    USD: { stroke: 'stroke-amber-500', bg: 'bg-amber-500' },
    LINK: { stroke: 'stroke-purple-600', bg: 'bg-purple-600' },
    AAVE: { stroke: 'stroke-pink-500', bg: 'bg-pink-500' },
    IMX: { stroke: 'stroke-emerald-500', bg: 'bg-emerald-500' },
    ONDO: { stroke: 'stroke-indigo-400', bg: 'bg-indigo-400' },
    RENDER: { stroke: 'stroke-orange-400', bg: 'bg-orange-400' },
    FET: { stroke: 'stroke-cyan-400', bg: 'bg-cyan-400' },
    UNI: { stroke: 'stroke-rose-400', bg: 'bg-rose-400' },
    HYPE: { stroke: 'stroke-lime-400', bg: 'bg-lime-400' },
};

const getColorFor = (symbol: string) => COLOR_MAP[symbol] || { stroke: 'stroke-gray-400', bg: 'bg-gray-400' };

export default function AllocationChart() {
    const { assets, activeAccount, activeStrategy, pendingOrders } = usePortfolio();

    const sorted = [...assets].sort((a, b) => b.allocation - a.allocation);
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

    // Donut chart
    const baseSize = 200;
    const strokeWidth = 16;
    const center = baseSize / 2;
    const radius = (baseSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    // Smart center display
    const centerMain = activeAccount === 'sui'
        ? Math.round(sorted.find(a => a.symbol === 'SUI')?.allocation ?? 0)
        : sorted.filter(a => a.symbol !== 'USD').length;
    const centerLabel = activeAccount === 'sui' ? 'SUI Anchor' : 'Alt Positions';
    const centerSuffix = activeAccount === 'sui' ? '%' : ' coins';

    // Smart directive
    const cashPercent = assets.find(a => a.symbol === 'USD')?.allocation || 0;
    const directive = generateDirective(activeAccount, assets, pendingOrders, cashPercent, activeStrategy);

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                    Allocation Monitor
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">{activeStrategy.targetMask}</span>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 py-4">
                {/* Donut */}
                <div className="relative w-full max-w-[280px] aspect-square flex-shrink-0">
                    <svg
                        viewBox={`0 0 ${baseSize} ${baseSize}`}
                        className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_40px_rgba(59,130,246,0.1)]"
                    >
                        <circle cx={center} cy={center} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-white/5" />
                        {sorted.map((asset) => {
                            const pct = asset.allocation / 100;
                            const strokeLength = pct * circumference;
                            const offset = currentOffset;
                            currentOffset += strokeLength;
                            const colors = getColorFor(asset.symbol);
                            return (
                                <circle
                                    key={asset.symbol}
                                    cx={center} cy={center} r={radius}
                                    fill="transparent" stroke="currentColor" strokeWidth={strokeWidth}
                                    strokeDasharray={`${strokeLength} ${circumference}`}
                                    strokeDashoffset={-offset} strokeLinecap="round"
                                    className={`${colors.stroke} transition-all duration-1000 ease-out`}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">
                            {activeAccount === 'sui' ? 'Strategy Weight' : 'Diversification'}
                        </span>
                        <div className="flex flex-col -space-y-1">
                            <span className="text-5xl font-black font-mono text-white">{centerMain}{centerSuffix}</span>
                            <span className="text-sm font-bold text-blue-500/80 uppercase tracking-tighter">{centerLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Strategy panel */}
                <div className="flex-1 flex flex-col h-full w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 w-full">
                        {sorted.map((asset) => {
                            const logoUrl = LOGO_MAPPING[asset.symbol];
                            const isKing = activeAccount === 'sui' && asset.symbol === 'SUI';
                            const isCash = asset.symbol === 'USD';
                            const colors = getColorFor(asset.symbol);

                            // Role label
                            const role = isKing ? 'Core' : isCash ? 'Safety' : activeAccount === 'alts' ? 'Alt' : 'Tactical';

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
                                                <span className="text-[8px] px-1 rounded bg-white/5 border border-white/10 text-gray-500 uppercase font-mono">{role}</span>
                                            </div>
                                            <span className="text-[9px] text-gray-600 font-mono tracking-tighter">
                                                Goal: {fmt(asset.targetAllocation)} • {asset.allocation > asset.targetAllocation ? 'OVER' : 'UNDER'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-base font-black font-mono text-white tracking-tighter">{fmt(asset.allocation)}</span>
                                        <span className={`text-[9px] font-mono ${(asset.gainLoss || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            PnL: {currency.format(asset.gainLoss || 0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Directive */}
                    <div className="mt-8">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-blue-500 font-black text-[10px] text-white">{directive.tag}</div>
                                <span className="text-xs font-black text-white uppercase tracking-widest">{directive.title}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: directive.body }}></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Generate real operational directive ───
function generateDirective(
    account: string,
    assets: { symbol: string; allocation: number; currentValue: number; gainLoss?: number | null }[],
    orders: { type: string; symbol: string; units: number; price: number }[],
    cashPercent: number,
    strategy: { targets: Record<string, { ideal?: number; max?: number; min?: number; label: string }> }
) {
    const cashTarget = strategy.targets.cash.ideal || 25;

    if (account === 'sui') {
        const suiPercent = assets.find(a => a.symbol === 'SUI')?.allocation || 0;
        const sellOrders = orders.filter(o => o.type === 'sell' && o.symbol === 'SUI');
        const sellLiquidity = sellOrders.reduce((s, o) => s + o.units * o.price, 0);

        if (cashPercent < 10) {
            return {
                tag: 'PRIORITY',
                title: 'Rebuild Cash Reserve',
                body: `Cash at <span class="text-rose-400 font-bold">${cashPercent.toFixed(1)}%</span> — critically below ${cashTarget}% target. SUI is <span class="text-white font-bold">${suiPercent.toFixed(0)}% of portfolio</span>. ${sellOrders.length > 0 ? `Execute ${sellOrders.length} pending SUI sells to recover <span class="text-emerald-400 font-bold">~$${sellLiquidity.toFixed(0)} in liquidity</span>.` : 'Consider trimming SUI on strength to rebuild cash.'}`
            };
        }
        return {
            tag: 'MONITOR',
            title: 'Hold Pattern — Watch SUI Strength',
            body: `SUI anchored at <span class="text-white font-bold">${suiPercent.toFixed(0)}%</span>. Cash at ${cashPercent.toFixed(0)}%. ${sellOrders.length > 0 ? `${sellOrders.length} ladder exits staged for <span class="text-emerald-400 font-bold">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(sellLiquidity)}</span>.` : 'No active sell orders. Monitor for trim opportunities on SUI pumps.'}`
        };
    } else {
        // Alts account
        const altAssets = assets.filter(a => a.symbol !== 'USD');
        const winners = altAssets.filter(a => (a.gainLoss || 0) > 0);
        const losers = altAssets.filter(a => (a.gainLoss || 0) < 0);
        const biggestLoser = losers.sort((a, b) => (a.gainLoss || 0) - (b.gainLoss || 0))[0];
        const buyOrders = orders.filter(o => o.type === 'buy');

        if (biggestLoser && Math.abs(biggestLoser.gainLoss || 0) > 300) {
            return {
                tag: 'PATIENT',
                title: `${biggestLoser.symbol} Recovery Play`,
                body: `${biggestLoser.symbol} is the deepest red at <span class="text-rose-400 font-bold">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(biggestLoser.gainLoss || 0)}</span>. ${buyOrders.filter(o => o.symbol === biggestLoser.symbol).length > 0 ? 'Dip buy orders staged to average down.' : 'Consider staging dip buys to lower cost basis.'} Cash at <span class="text-white font-bold">${cashPercent.toFixed(0)}%</span> — ${cashPercent > 20 ? 'healthy dry powder.' : 'tight, use sparingly.'}`
            };
        }
        return {
            tag: 'ROTATE',
            title: 'Balanced Rotation Active',
            body: `${winners.length} green / ${losers.length} red positions. ${buyOrders.length} buy orders staged. Cash at <span class="text-white font-bold">${cashPercent.toFixed(0)}%</span> — ${cashPercent > 25 ? 'healthy. Deploy on dips.' : 'tight. Wait for sells to execute before new buys.'}`
        };
    }
}
