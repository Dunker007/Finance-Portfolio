"use client";
import React, { useState, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

export default function AIAnalyst() {
    const { activeStrategy, activeAccount, assets } = usePortfolio();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'ai', text: string, timestamp: string }[]>([
        { role: 'ai', text: `Strategy loaded: ${activeStrategy.name}. Account: ${activeStrategy.accountLabel}. Mode: MANUAL. Ready to assist with ${activeAccount === 'sui' ? 'SUI-anchored swing plays' : 'balanced alt rotation'}. What's on your mind?`, timestamp: 'Just now' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const RULES_DISPLAY = activeStrategy.rules.slice(0, 3).map(r => r.split('—')[0].trim());

    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const cashPercent = ((assets.find(a => a.symbol === 'USD')?.currentValue || 0) / totalValue * 100).toFixed(1);

    const handleSend = () => {
        if (!query.trim()) return;
        const userMessage = query.trim();
        setQuery('');
        setHistory(prev => [...prev, { role: 'user', text: userMessage, timestamp: 'Now' }]);
        setIsTyping(true);

        setTimeout(() => {
            const response = generateResponse(userMessage.toLowerCase());
            setHistory(prev => [...prev, { role: 'ai', text: response, timestamp: 'Just now' }]);
            setIsTyping(false);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 800 + Math.random() * 700);
    };

    const generateResponse = (q: string): string => {
        const fee = '1% trade fee';

        // Account-specific responses
        if (activeAccount === 'sui') {
            if (q.includes('sui')) return `SUI is your king at ${(assets.find(a => a.symbol === 'SUI')?.allocation || 0).toFixed(1)}%. Strategy: never below 40-45%, compound over years. Pending ladder sells at $1.02/$1.05 to rebuild cash (currently ${cashPercent}% — critical). ${fee} per move.`;
            if (q.includes('cash')) return `Cash at ${cashPercent}% — CRITICAL vs 25% target. Priority #1: trim SUI on strength to rebuild. Your ladder sells ($1.02/$1.05) are the engine. No new alt entries until cash improves.`;
            if (q.includes('link') || q.includes('aave') || q.includes('imx')) return `Alt positions are tactical swings. Enter on dips (10%+), take 20-50% profits, recycle to SUI or cash. Current alts are small — that's correct for SUI-king strategy.`;
        } else {
            if (q.includes('ondo')) return `ONDO at ${(assets.find(a => a.symbol === 'ONDO')?.allocation || 0).toFixed(1)}% — up ~8-9% today. You're green (+$48). Pending dip buys at $0.189/$0.229, sell target at $0.398 (~47% profit). Balanced position. ${fee} per move.`;
            if (q.includes('render')) return `RENDER at ${(assets.find(a => a.symbol === 'RENDER')?.allocation || 0).toFixed(1)}% — biggest loss (-$694). Entry was high ($1.86). Dip buys at $1.058/$1.201 to average down. Sell target at $1.99 for recovery. Patience here.`;
            if (q.includes('fet')) return `FET at ${(assets.find(a => a.symbol === 'FET')?.allocation || 0).toFixed(1)}% — nearly flat (-$0.57). Solid accumulation at $0.17. Dip buys at $0.148/$0.151, sell target at $0.2515 (~50% profit). Well-positioned.`;
            if (q.includes('uni')) return `UNI at ${(assets.find(a => a.symbol === 'UNI')?.allocation || 0).toFixed(1)}% — small loss (-$33). Dip buys at $2.79/$3.12, moonshot sell at $5.18. Classic swing setup. ${fee} per move.`;
            if (q.includes('hype')) return `HYPE is your smallest position at ${(assets.find(a => a.symbol === 'HYPE')?.allocation || 0).toFixed(1)}% — green (+$11). Dip buys at $23.59/$27, aggressive sell at $47.17 (~49%). High beta play. ${fee} per move.`;
            if (q.includes('cash')) return `Cash at ${cashPercent}% — healthy and within your 20-40% target range. Good dry powder for dip entries. No urgency to deploy unless opportunities arise.`;
        }

        if (q.includes('strateg') || q.includes('plan')) return `${activeStrategy.name}: ${activeStrategy.rules[0]} Target: ${activeStrategy.targetMask}. Cash at ${cashPercent}%.`;
        if (q.includes('fee')) return `Alto charges ${fee} on every buy and sell. Factor this into your entry/exit sizing — avoid churning small positions.`;
        if (q.includes('roth') || q.includes('tax')) return `Both accounts are converted Roths. All gains tax-free — perfect for active swing trading without IRS drag.`;

        return `I'm tracking ${assets.filter(a => a.symbol !== 'USD').length} positions in this account. Cash at ${cashPercent}%. Strategy: ${activeStrategy.name}. Ask me about any specific coin, your cash position, fees, or strategy.`;
    };

    return (
        <div className="flex flex-col h-full p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">AI Analyst</h3>
                <span className="text-[9px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                    {activeAccount === 'sui' ? '👑 SUI' : '🔄 ALTS'}
                </span>
            </div>

            {/* Rules chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {RULES_DISPLAY.map((rule, i) => (
                    <span key={i} className="text-[8px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-gray-500 font-medium">
                        {rule}
                    </span>
                ))}
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600/20 text-blue-200 border border-blue-500/20'
                                : 'bg-white/5 text-gray-300 border border-white/5'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-gray-500 text-xs animate-pulse">Analyzing...</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about strategy, positions..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all"
                />
                <button onClick={handleSend} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                    Send
                </button>
            </div>
        </div>
    );
}
