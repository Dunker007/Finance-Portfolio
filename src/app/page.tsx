"use client";
import React from 'react';
import AssetTable from '@/components/AssetTable';
import DetailedMetrics from '@/components/DetailedMetrics';
import AIAnalyst from '@/components/AIAnalyst';
import PendingOrders from '@/components/PendingOrders';
import AllocationChart from '@/components/AllocationChart';
import PriceTicker from '@/components/PriceTicker';
import { usePortfolio } from '@/context/PortfolioContext';
import { STRATEGY } from '@/data/strategy';

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const [syncTime, setSyncTime] = React.useState("");
  const { assets } = usePortfolio();
  const suiAsset = assets.find(a => a.symbol === 'SUI');
  const suiWeight = suiAsset?.allocation?.toFixed(1) ?? '0.0';

  React.useEffect(() => {
    setMounted(true);
    setSyncTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <>
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 text-white">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/40 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/30 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      </div>

      <header className="h-16 flex items-center justify-between px-8 glass-panel z-50 shrink-0 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">MANUAL MODE</span>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{STRATEGY.taxWrapper}</span>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <span className="text-[10px] font-mono text-gray-500 tracking-tighter lowercase opacity-50">
            last_sync: {mounted ? syncTime : "--:--:--"}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Target Mask</span>
            <span className="text-[11px] font-mono text-gray-400">{STRATEGY.targetMask}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] opacity-50">Anchor Weight</span>
            <span className="text-sm font-black text-blue-400 tracking-tight">{suiWeight}% SUI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth custom-scrollbar">
        {/* Top Metrics Row */}
        <section className="animate-fade-in-up">
          <DetailedMetrics />
        </section>

        {/* Global Market Pulse */}
        <section className="animate-fade-in-up delay-75">
          <PriceTicker />
        </section>

        {/* Allocation Monitor Tier */}
        <section className="glass-card p-6 min-h-[360px] animate-fade-in-up delay-100">
          <AllocationChart />
        </section>

        {/* Strategy Hub & Order Command */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[450px]">
          {/* AI Strategy Node */}
          <div className="glass-card lg:col-span-4 p-0 overflow-hidden flex flex-col h-full border-l-4 border-l-blue-500/50">
            <div className="h-full bg-gradient-to-b from-blue-900/5 to-transparent">
              <AIAnalyst />
            </div>
          </div>

          {/* Pending Strategy Logs */}
          <div className="glass-card lg:col-span-8 p-0 h-full overflow-hidden">
            <PendingOrders />
          </div>
        </section>

        {/* Global Positions Ledger */}
        <section className="glass-card p-0 overflow-hidden min-h-[500px] animate-fade-in-up delay-150">
          <AssetTable />
        </section>

        <div className="h-10"></div> {/* Bottom Buffer */}
      </main>
    </>
  );
}
