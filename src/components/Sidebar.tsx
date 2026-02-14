"use client";
import Link from 'next/link';
import { FC } from 'react';

import { usePortfolio } from '../context/PortfolioContext';

const Sidebar = () => {
    const { assets } = usePortfolio();
    const suiAsset = assets.find(a => a.symbol === 'SUI');
    const suiWeight = suiAsset?.allocation || 0;

    return (
        <aside className="w-64 glass-panel border-r border-white/5 flex flex-col h-full z-40">
            <div className="p-8">
                <div className="flex items-center gap-3 group px-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:rotate-12 transition-transform duration-500">
                        <span className="text-white font-black text-xl tracking-tighter">SF</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black tracking-tighter text-lg">SmartFolio</span>
                        <span className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">Enterprise AI</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <NavItem icon="📊" label="Strategic Hub" active />
                <NavItem icon="🗺️" label="Asset Roadmap" />
                <NavItem icon="🛡️" label="Risk Guard" />
                <NavItem icon="🤖" label="AI Insight" />
            </nav>

            {/* Strategy Pulse Section */}
            <div className="p-6 mt-auto">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Strategy Pulse</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-white uppercase tracking-tighter">AGGRESSIVE GROWTH</span>
                            <span className="text-[10px] font-mono text-blue-400">{suiWeight.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                style={{ width: `${suiWeight}%` }}
                            ></div>
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-600 font-medium leading-relaxed uppercase tracking-tight">
                        Current Bias: SUI Anchor {suiWeight > 50 ? 'Strong' : 'Diluted'}. Monitoring Alt Rotations.
                    </p>
                </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">IRA</div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white">Roth Alto (#82367)</span>
                    <span className="text-[9px] text-emerald-400 font-bold">CONNECTED</span>
                </div>
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, active }: { icon: string; label: string; active?: boolean }) => (
    <Link href="#" className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

export default Sidebar;
