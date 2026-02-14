"use client";
import Link from 'next/link';
import { useState } from 'react';

import { usePortfolio } from '../context/PortfolioContext';
import { ACCOUNTS, AccountId } from '../data/portfolio';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

const Sidebar = () => {
    const { assets, activeAccount, switchAccount, activeStrategy } = usePortfolio();
    const [isOpen, setIsOpen] = useState(false);

    const suiAsset = assets.find(a => a.symbol === 'SUI');
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

    // For Strategy Pulse — show anchor weight (SUI account) or cash weight (Alts account)
    const pulsePercent = activeAccount === 'sui'
        ? (suiAsset?.allocation || 0)
        : (assets.find(a => a.symbol === 'USD')?.allocation || 0);
    const pulseLabel = activeAccount === 'sui' ? 'SUI Anchor' : 'Cash Buffer';

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl bg-[#111]/90 border border-white/10 flex items-center justify-center backdrop-blur-md"
                aria-label="Open menu"
            >
                <span className="text-white text-lg">☰</span>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[69] animate-fade-in-up"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 glass-panel border-r border-white/5 flex flex-col h-full z-[70]
                fixed lg:relative
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-6 pb-4">
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

                {/* ═══ Account Switcher ═══ */}
                <div className="px-4 pb-4 space-y-1.5">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] px-2">Accounts</span>
                    {(Object.keys(ACCOUNTS) as AccountId[]).map(id => {
                        const acct = ACCOUNTS[id];
                        const isActive = id === activeAccount;
                        return (
                            <button
                                key={id}
                                onClick={() => { switchAccount(id); setIsOpen(false); }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${isActive
                                        ? 'bg-blue-500/10 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                                        : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                                        }`}>
                                        {id === 'sui' ? '👑' : '🔄'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                            {acct.accountName}
                                        </span>
                                        <span className="text-[9px] text-gray-600 font-mono">{acct.accountNumber}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="📊" label="Strategic Hub" active onClick={() => setIsOpen(false)} />
                    <NavItem icon="🗺️" label="Asset Roadmap" onClick={() => setIsOpen(false)} />
                    <NavItem icon="🛡️" label="Risk Guard" onClick={() => setIsOpen(false)} />
                    <NavItem icon="🤖" label="AI Insight" onClick={() => setIsOpen(false)} />
                </nav>

                {/* Strategy Pulse */}
                <div className="p-6 mt-auto">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Strategy Pulse</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-white uppercase tracking-tighter">
                                    {activeStrategy.name.split('—')[0].trim()}
                                </span>
                                <span className="text-[10px] font-mono text-blue-400">{pulsePercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                    style={{ width: `${Math.min(pulsePercent, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-600 font-medium leading-relaxed uppercase tracking-tight">
                            {pulseLabel}: {pulsePercent > 50 ? 'Strong' : 'Building'}. {activeAccount === 'sui' ? 'Monitoring Alt Rotations.' : 'Balanced Rotation Active.'}
                        </p>
                    </div>
                </div>

                {/* Account Footer */}
                <div className="p-6 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">IRA</div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white">Roth Alto ({ACCOUNTS[activeAccount].accountNumber})</span>
                        <span className="text-[9px] text-emerald-400 font-bold">CONNECTED</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

const NavItem = ({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) => (
    <Link href="#" onClick={onClick} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

export default Sidebar;
