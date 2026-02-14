"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { usePortfolio } from '../context/PortfolioContext';
import { ACCOUNTS, AccountId } from '../data/portfolio';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { assets, activeAccount, switchAccount, activeStrategy, pendingOrders, marketCondition } = usePortfolio();
    const [isOpen, setIsOpen] = useState(false);

    const suiAsset = assets.find(a => a.symbol === 'SUI');
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);

    // Combined AUM: live data for active account + seed data for other
    const otherAccountId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
    const otherAccountValue = ACCOUNTS[otherAccountId].assets.reduce((s, a) => s + a.currentValue, 0);
    const combinedAUM = totalValue + otherAccountValue;

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
                    {(Object.keys(ACCOUNTS) as AccountId[])
                        .sort((a, b) => {
                            const valA = a === activeAccount ? totalValue : otherAccountValue;
                            const valB = b === activeAccount ? totalValue : otherAccountValue;
                            return valB - valA;
                        })
                        .map(id => {
                            const acct = ACCOUNTS[id];
                            const isActive = id === activeAccount;
                            const acctValue = isActive ? totalValue : otherAccountValue;
                            return (
                                <button
                                    key={id}
                                    onClick={() => {
                                        switchAccount(id);
                                        setIsOpen(false);
                                        if (pathname === '/aum' || pathname === '/market') router.push('/');
                                    }}
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
                                        <span className={`text-[10px] font-black font-mono ${isActive ? 'text-white' : 'text-gray-500'}`}>{currency.format(acctValue)}</span>
                                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                    </div>
                                </button>
                            );
                        })}

                    {/* Combined AUM — same card style */}
                    <Link href="/aum" onClick={() => setIsOpen(false)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${pathname === '/aum'
                            ? 'bg-purple-500/10 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                            : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${pathname === '/aum' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                💰
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-black ${pathname === '/aum' ? 'text-white' : 'text-gray-400'}`}>Combined AUM</span>
                                <span className="text-[9px] text-gray-600 font-mono">2 Roth IRAs</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black font-mono ${pathname === '/aum' ? 'text-purple-400' : 'text-blue-400'}`}>{currency.format(combinedAUM)}</span>
                    </Link>
                </div>

                {/* Strategy Pulse */}
                <div className="px-6 pb-6 pt-2">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Strategy Pulse</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black text-white uppercase tracking-tighter">
                                    {/* Dynamic Strategy Status */}
                                    {pendingOrders.some(o => o.symbol === 'SUI' && o.type === 'sell') ? 'Pending Rebalance'
                                        : pendingOrders.length > 0 ? 'Active Deployment'
                                            : activeAccount === 'sui' && (suiAsset?.allocation || 0) > 60 ? 'Harvest Required'
                                                : activeStrategy.name.split('—')[0].trim()}
                                </span>
                                <span className={`text-[10px] font-mono ${pendingOrders.length > 0 ? 'text-amber-400 animate-pulse' : 'text-blue-400'}`}>
                                    {pulsePercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ${pendingOrders.length > 0 ? 'bg-amber-500 w-full animate-pulse' // Show full amber bar if working
                                        : 'bg-blue-500'}`}
                                    style={{ width: pendingOrders.length > 0 ? '100%' : `${Math.min(pulsePercent, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-600 font-medium leading-relaxed uppercase tracking-tight">
                            {pendingOrders.length > 0
                                ? <span className="text-amber-500/80">⚠️ Execution In Progress. {pendingOrders.length} orders staged.</span>
                                : <>{pulseLabel}: {pulsePercent > 50 ? 'Strong' : 'Building'}. {activeAccount === 'sui' ? 'Monitoring Alt Rotations.' : 'Balanced Rotation Active.'}</>
                            }
                        </p>
                    </div>

                    {/* Market Signal Tile */}
                    <Link href="/market" className="block mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Macro Signal</span>
                            <span className="text-xs group-hover:scale-110 transition-transform">
                                {marketCondition === 'bull' ? '🚀'
                                    : marketCondition === 'bear' ? '🛡️'
                                        : marketCondition === 'accumulation' ? '🧺'
                                            : marketCondition === 'distribution' ? '💰'
                                                : '🌊'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${marketCondition === 'bull' ? 'text-blue-400'
                                : marketCondition === 'bear' ? 'text-rose-400'
                                    : marketCondition === 'accumulation' ? 'text-emerald-400'
                                        : marketCondition === 'distribution' ? 'text-amber-400'
                                            : 'text-gray-400'
                                }`}>
                                {marketCondition === 'bull' ? 'Risk On'
                                    : marketCondition === 'bear' ? 'Risk Off'
                                        : marketCondition === 'accumulation' ? 'Accumulate'
                                            : marketCondition === 'distribution' ? 'Profit Take'
                                                : 'Choppy'}
                            </span>
                            <span className="text-[9px] text-gray-600 font-mono group-hover:text-white transition-colors">Set &rarr;</span>
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-1">
                    <NavItem icon="📊" label="Strategic Hub" href="/" active={pathname === '/'} onClick={() => setIsOpen(false)} />
                    <NavItem icon="🛒" label="Order Builder" href="/orders" active={pathname === '/orders'} onClick={() => setIsOpen(false)} />
                    <NavItem icon="🛡️" label="Risk Guard" href="/risk" active={pathname === '/risk'} onClick={() => setIsOpen(false)} />
                    <NavItem icon="📋" label="Portfolio Report" href="/report" active={pathname === '/report'} onClick={() => setIsOpen(false)} />
                </nav>

                {/* Spacer to push Nav down or Footer down? User said "below AUM". 
                    If I put Pulse below AUM, Nav follows Pulse. 
                    I'll add a spacer if needed, but flex-col naturally stacks them. 
                    I will simply remove the old Pulse block. 
                */}

                {/* Account Footer */}
                <div className="p-6 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {pathname === '/aum' ? '💰' : 'IRA'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white">
                            {pathname === '/aum' ? 'Combined Portfolio' : ACCOUNTS[activeAccount].accountName}
                        </span>
                        <span className={`text-[9px] font-bold ${pathname === '/aum' ? 'text-purple-400' : 'text-emerald-400'}`}>
                            {pathname === '/aum' ? '2 ACCOUNTS ACTIVE' : `${ACCOUNTS[activeAccount].accountNumber} • CONNECTED`}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

const NavItem = ({ icon, label, href, active, onClick }: { icon: string; label: string; href: string; active?: boolean; onClick?: () => void }) => (
    <Link href={href} onClick={onClick} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

export default Sidebar;
