"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function AIAnalyst() {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'ai', text: string, timestamp: string }[]>([
        { role: 'ai', text: "Systems online. Strategy locked: SUI is King. Core focus is long-term growth with opportunistic alt swinging. Current priority: Rebuilding cash reserve (5.6% -> 25%) via SUI laddered sells at $1.02 and $1.05. How can I assist with your rebalance today?", timestamp: 'Just now' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const STRATEGY_RULES = [
        "SUI is the Anchor (min 45% allocation)",
        "Alts are Tactical (trim on 20-50% pumps)",
        "Cash is the Safety Net (target 25%)"
    ];

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
                response = "The laddered SUI exit ($1.02/$1.05) is tactical brilliance. It captures the current pump without sacrificing the 'King' position. If filled, we replenish USDC dry powder by ~30%, significantly improving our defensive posture.";
            } else if (low.includes('alt') || low.includes('link') || low.includes('aave')) {
                response = "LINK and AAVE are our primary swing candidates. We enter on -10% pullbacks and recycle gains directly back into SUI or the Cash Reserve. We're currently under-allocated to alts (13% vs 25%), so I'm watching for dip entry triggers.";
            } else if (low.includes('cash') || low.includes('reserve')) {
                response = "Priority #1. At 5.6%, we're 'cash poor'. The SUI trim is the engine for the fix. Once we hit 15% USDC, we'll shift from 'aggressive recovery' back to 'patient accumulation'.";
            } else if (low.includes('plan')) {
                response = "Next 24 Hours:\n1. Track SUI momentum toward $1.02.\n2. Keep dip-buy orders live for LINK ($7.92) & IMX ($0.149).\n3. Maintain patient bias. No market buys.";
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
                {STRATEGY_RULES.map((rule, i) => (
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
