"use client";
import React from 'react';
import AssetTable from '@/components/AssetTable';
import DetailedMetrics from '@/components/DetailedMetrics';
import AIAnalyst from '@/components/AIAnalyst';
import AllocationChart from '@/components/AllocationChart';
import PriceTicker from '@/components/PriceTicker';
import PortfolioHealth from '@/components/PortfolioHealth';
import TradeJournal from '@/components/TradeJournal';
import { usePortfolio } from '@/context/PortfolioContext';
import { TAX_WRAPPER } from '@/data/strategy';

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const { assets, activeAccount, activeStrategy, isLiveMode, toggleLiveMode, lastSync, refreshPrices } = usePortfolio();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dynamic anchor metric
  const anchorLabel = activeAccount === 'sui' ? 'Anchor Weight' : 'Cash Buffer';
  const anchorValue = activeAccount === 'sui'
    ? `${(assets.find(a => a.symbol === 'SUI')?.allocation || 0).toFixed(1)}% SUI`
    : `${(assets.find(a => a.symbol === 'USD')?.allocation || 0).toFixed(1)}% Cash`;

  React.useEffect(() => {
    setMounted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    setIsRefreshing(false);
  };

  return (
    <>
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 text-white">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/40 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/30 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      </div>

      <header className="h-16 flex items-center justify-between px-4 pl-16 lg:pl-8 lg:px-8 glass-panel z-50 shrink-0 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
          <button
            onClick={toggleLiveMode}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all uppercase tracking-wider ${isLiveMode
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            {isLiveMode ? 'LIVE (30s)' : 'MANUAL'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh prices from Coinbase"
          >
            🔄
          </button>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{TAX_WRAPPER}</span>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <span className="text-[10px] font-mono text-gray-500 tracking-tighter lowercase opacity-50">
            {mounted && lastSync ? `coinbase_sync: ${lastSync.toLocaleTimeString()}` : 'sync: pending...'}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Target Mask</span>
            <span className="text-[11px] font-mono text-gray-400">{activeStrategy.targetMask}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] opacity-50">{anchorLabel}</span>
            <span className="text-sm font-black text-blue-400 tracking-tight">{anchorValue}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth scrollbar-hide">
        {/* Top Metrics Row */}
        <section className="animate-fade-in-up">
          <DetailedMetrics />
        </section>

        {/* Global Market Pulse */}
        <section className="animate-fade-in-up delay-75">
          <PriceTicker />
        </section>

        {/* Portfolio Health Monitor */}
        <section className="glass-card p-6 animate-fade-in-up delay-100">
          <PortfolioHealth />
        </section>

        {/* AI Analyst + Allocation Monitor */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px] animate-fade-in-up delay-100">
          <div className="glass-card lg:col-span-4 p-0 overflow-hidden flex flex-col h-full border-l-4 border-l-blue-500/50">
            <div className="h-full bg-gradient-to-b from-blue-900/5 to-transparent">
              <AIAnalyst />
            </div>
          </div>
          <div className="glass-card lg:col-span-8 p-6 overflow-hidden">
            <AllocationChart />
          </div>
        </section>

        {/* Global Positions Ledger — orders built into expandable rows */}
        <section className="glass-card p-0 overflow-hidden min-h-[500px] animate-fade-in-up delay-150">
          <AssetTable />
        </section>

        {/* Trade Journal */}
        <section className="glass-card p-6 min-h-[300px] animate-fade-in-up delay-200">
          <TradeJournal />
        </section>

        <div className="h-10"></div> {/* Bottom Buffer */}
      </main>
    </>
  );
}
