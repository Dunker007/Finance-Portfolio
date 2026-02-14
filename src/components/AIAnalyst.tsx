"use client";
import React, { useState, useEffect, useRef } from 'react';
import { STRATEGY } from '../data/strategy';

export default function AIAnalyst() {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'ai', text: string, timestamp: string }[]>([
        { role: 'ai', text: `Strategy loaded: ${STRATEGY.name}. Mode: ${STRATEGY.mode} (${STRATEGY.taxWrapper}). Current priority: Cash reserve critically low (~5.7% vs 25% target). Laddered SUI exits at $1.02/$1.05 are the engine to fix this. Alt positions are tactical — enter dips, take 20-50% profits, recycle to SUI or cash. How can I assist?`, timestamp: 'Just now' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const RULES_DISPLAY = STRATEGY.rules.slice(0, 3).map(r => r.split('—')[0].trim());

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSend = () => {
        if (!query.trim()) return;
        const userText = query;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setHistory(prev => [...prev, { role: 'user', text: userText, timestamp: now }]);
        setQuery('');
        setIsTyping(true);

        setTimeout(() => {
            let response = "Logged. I'll maintain the high-conviction SUI bias while monitoring for alt-rotation opportunities.";
            const low = userText.toLowerCase();

            if (low.includes('sui') || low.includes('trim')) {
                response = `The laddered SUI exits ($1.02/$1.05) capture strength without killing the King position. If both fill → ~$1,155 proceeds. Split: ${STRATEGY.suiTrimStrategy.exampleSplit.suiDipBuysLater}% to SUI dip buys later, ${STRATEGY.suiTrimStrategy.exampleSplit.altSwings}% to alt swings, ${STRATEGY.suiTrimStrategy.exampleSplit.cashReserve}% straight to cash. This is the #1 priority trade right now.`;
            } else if (low.includes('alt') || low.includes('link') || low.includes('aave')) {
                response = `LINK and AAVE are the primary swing candidates. We enter on ~${STRATEGY.thresholds.altDipEntryPercent}% pullbacks and take profits at ${STRATEGY.thresholds.altProfitTakeMin}-${STRATEGY.thresholds.altProfitTakeMax}% gains. All profits get recycled to SUI or Cash. Currently under-allocated to alts (~13% vs 25%), watching for dip entries. Remember: alts are tactical ONLY — never HODL forever.`;
            } else if (low.includes('cash') || low.includes('reserve')) {
                response = `CRITICAL priority. At ~5.7%, we're well below the ${STRATEGY.thresholds.cashCriticalBelow}% emergency line. The SUI ladder is the engine to fix this. Once we hit ${STRATEGY.thresholds.cashHealthyAbove}% USDC, we shift from 'aggressive recovery' to 'patient accumulation'. No new alt entries until cash is above 15%.`;
            } else if (low.includes('plan') || low.includes('next')) {
                response = "Today/Tomorrow Action Items:\n1. Monitor SUI momentum — $1.00-$1.05 zone is the trim target.\n2. Keep dip-buy orders live: LINK @ $7.92, IMX @ $0.149.\n3. Clean stale orders (old IMX sells, BTC buy if outdated).\n4. NO market buys — patience and limits only.\n5. All inside Roth = tax-free gains. No rush.";
            } else if (low.includes('manual') || low.includes('api') || low.includes('alto')) {
                response = "Alto has no functional trading APIs. All orders must be placed manually through the Alto platform. This dashboard is your strategy command center — use it to plan, simulate, and track. Execute trades by hand on Alto's interface.";
            }

            setHistory(prev => [...prev, { role: 'ai', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden border-r border-white/5">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                    </div>
                    <div>
                        <h2 className="text-xs font-black text-white uppercase tracking-tighter">Strategic Analyst</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-400 font-mono">CORE_CONNECTED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Overlay */}
            <div className="p-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-white/5 bg-black/40">
                {RULES_DISPLAY.map((rule, i) => (
                    <div key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-gray-500 font-mono uppercase">
                        {rule}
                    </div>
                ))}
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {history.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-600 mt-1 uppercase font-mono">{msg.timestamp}</span>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-1 items-center p-2 opacity-50">
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Entry Box */}
            <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/5">
                <div className="relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Inquire about SUI trim levels..."
                        className="w-full bg-[#111] text-xs rounded-lg py-3 pl-4 pr-10 border border-white/10 focus:border-blue-500/50 outline-none transition-all"
                    />
                    <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
