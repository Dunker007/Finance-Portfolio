"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import {
    hasGeminiKey,
    startChat,
    sendMessage as geminiSend,
    quickHealthCheck,
    PortfolioSnapshot
} from '../lib/geminiService';

// ─── Persona Definitions ───
const PERSONAS = {
    sui: {
        name: 'The Anchor',
        role: 'Strategic Accumulation Manager',
        icon: '⚓',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        gradient: 'from-blue-900/50 to-blue-600/10',
        voice: 'Disciplined. Mathematical. Obsessed with 60/40 ratio.',
        persona: 'anchor' as const,
    },
    alts: {
        name: 'The Tactician',
        role: 'High Conviction Rotator',
        icon: '⚡',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        gradient: 'from-purple-900/50 to-purple-600/10',
        voice: 'Agile. Anti-bloat. Maximizing the High Conviction 5.',
        persona: 'tactician' as const,
    }
};

export default function AIAnalyst() {
    const { activeStrategy, activeAccount, assets, pendingOrders, marketCondition } = usePortfolio();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{ role: 'user' | 'ai'; text: string; timestamp: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isGemini, setIsGemini] = useState(false);
    const [primaryDirective, setPrimaryDirective] = useState<{ title: string; desc: string; type: 'alert' | 'success' | 'info' } | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const persona = PERSONAS[activeAccount];
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const cashAsset = assets.find(a => a.symbol === 'USD');
    const cashPercent = ((cashAsset?.currentValue || 0) / totalValue * 100);

    // ─── Build Portfolio Snapshot for Gemini ───
    const buildSnapshot = useCallback((): PortfolioSnapshot => ({
        accountName: activeAccount === 'sui' ? 'SUI Account' : 'Alts Account',
        strategyName: activeStrategy.name,
        targetMask: activeStrategy.targetMask,
        marketRegime: marketCondition || 'unknown',
        totalValue,
        cashPercent,
        positions: assets.filter(a => a.symbol !== 'USD').map(a => ({
            symbol: a.symbol,
            units: a.units,
            avgCost: a.avgCost,
            currentPrice: a.currentPrice,
            currentValue: a.currentValue,
            allocation: a.allocation,
            targetAllocation: a.targetAllocation,
            gainLoss: a.gainLoss,
        })),
        pendingOrders: pendingOrders.map(o => ({
            type: o.type,
            symbol: o.symbol,
            units: o.units,
            price: o.price,
            note: o.note,
        })),
        strategyRules: activeStrategy.rules,
    }), [activeAccount, activeStrategy, assets, pendingOrders, marketCondition, totalValue, cashPercent]);

    // ─── Initialize Gemini Chat on Account Change ───
    useEffect(() => {
        const geminiAvailable = hasGeminiKey();
        setIsGemini(geminiAvailable);

        if (geminiAvailable) {
            // Initialize Gemini chat session with portfolio context
            const snapshot = buildSnapshot();
            startChat(snapshot, persona.persona).then(() => {
                // After chat init, get a health check as the greeting
                quickHealthCheck(snapshot, persona.persona).then(greeting => {
                    setHistory([{
                        role: 'ai',
                        text: greeting,
                        timestamp: 'Just now'
                    }]);
                }).catch(() => {
                    setHistory([{
                        role: 'ai',
                        text: `${persona.name} Online. Gemini connected. How can I assist?`,
                        timestamp: 'Just now'
                    }]);
                });
            });
        } else {
            // Fallback: rule-based greeting
            setHistory([{
                role: 'ai',
                text: activeAccount === 'sui'
                    ? `Anchor System Online. SUI Allocation: ${(assets.find(a => a.symbol === 'SUI')?.allocation || 0).toFixed(1)}%. Tracking 60/40 adherence. How can I assist?`
                    : `Tactician Online. Monitoring High Conviction 5. Market Regime: ${marketCondition?.toUpperCase() || 'UNKNOWN'}. Ready for rotation logic.`,
                timestamp: 'Just now'
            }]);
        }

        // ─── Ongoing Rule-Based Analysis Engine (always runs) ───
        if (activeAccount === 'sui') {
            const sui = assets.find(a => a.symbol === 'SUI');
            const suiAlloc = sui?.allocation || 0;

            if (suiAlloc > 62) {
                setPrimaryDirective({
                    title: 'OVERWEIGHT DETECTED',
                    desc: `SUI is at ${suiAlloc.toFixed(1)}% (Target 60%). Recommend trimming to restore cash buffer.`,
                    type: 'alert'
                });
            } else if (cashPercent < 10) {
                setPrimaryDirective({
                    title: 'CASH CRITICAL',
                    desc: 'Liquidity below 10%. Stop buying. Prioritize SUI trims on next pump.',
                    type: 'alert'
                });
            } else if (pendingOrders.length > 0) {
                setPrimaryDirective({
                    title: 'EXECUTION PHASE',
                    desc: `${pendingOrders.length} orders active. Monitoring fills.`,
                    type: 'info'
                });
            } else {
                setPrimaryDirective({
                    title: 'ACCUMULATION MODE',
                    desc: 'Portfolio balanced. Maintain 60/40 drift checks.',
                    type: 'success'
                });
            }
        } else {
            const positionCount = assets.filter(a => a.symbol !== 'USD' && a.currentValue > 10).length;
            const maxConc = Math.max(...assets.filter(a => a.symbol !== 'USD').map(a => a.allocation));

            if (positionCount > 5) {
                setPrimaryDirective({
                    title: 'BLOAT WARNING',
                    desc: `Holding ${positionCount} positions. Doctrine limit is 5. Consolidate conviction.`,
                    type: 'alert'
                });
            } else if (maxConc > 22) {
                setPrimaryDirective({
                    title: 'CONCENTRATION RISK',
                    desc: `Single asset > 22%. Consider trimming to rebalance into laggards.`,
                    type: 'alert'
                });
            } else {
                setPrimaryDirective({
                    title: 'HIGH CONVICTION',
                    desc: 'Core 5 structure intact. Monitoring rotation opportunities.',
                    type: 'success'
                });
            }
        }
    }, [activeAccount, assets, pendingOrders, marketCondition]);

    // ─── Send Message Handler ───
    const handleSend = async () => {
        if (!query.trim()) return;
        const userMessage = query.trim();
        setQuery('');
        setHistory(prev => [...prev, { role: 'user', text: userMessage, timestamp: 'Now' }]);
        setIsTyping(true);

        if (isGemini) {
            try {
                // Re-init chat with fresh portfolio state on each message for accuracy
                const snapshot = buildSnapshot();
                await startChat(snapshot, persona.persona);
                const response = await geminiSend(userMessage);
                setHistory(prev => [...prev, { role: 'ai', text: response, timestamp: 'Just now' }]);
            } catch (error) {
                setHistory(prev => [...prev, { role: 'ai', text: '⚠️ Gemini unavailable. Check Settings.', timestamp: 'Just now' }]);
            }
        } else {
            // Fallback: Rule-based responses
            setTimeout(() => {
                const response = generateFallbackResponse(userMessage.toLowerCase());
                setHistory(prev => [...prev, { role: 'ai', text: response, timestamp: 'Just now' }]);
            }, 600 + Math.random() * 500);
        }

        setIsTyping(false);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const generateFallbackResponse = (q: string): string => {
        if (activeAccount === 'sui') {
            if (q.includes('buy') || q.includes('entry')) return "Only buy on >10% dips from here. We are anchoring, not chasing. Check cash reserves first.";
            if (q.includes('sell') || q.includes('trim')) return "If SUI > 60%, trim aggressively. If < 60%, hold. Do not over-trade the anchor.";
            if (q.includes('status')) return `SUI: ${(assets.find(a => a.symbol === 'SUI')?.allocation || 0).toFixed(1)}%. Cash: ${cashPercent.toFixed(1)}%. We are ${cashPercent < 20 ? 'cash poor' : 'liquid'}.`;
        } else {
            if (q.includes('buy')) return "Is this one of the High Conviction 5? If not, ignore it. Do not dilute focus.";
            if (q.includes('sell')) return "Take profits at 20-30% pumps to rotate into laggards. Keep the wheel spinning.";
        }
        return "⚙️ AI running in offline mode. Add your Gemini API key in Settings for live intelligence.";
    };

    return (
        <div className={`flex flex-col h-full overflow-hidden relative ${persona.gradient} bg-opacity-20`}>
            {/* ═══ COMMAND HEADER ═══ */}
            <div className={`p-4 border-b ${persona.border} bg-black/20 backdrop-blur-md flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${persona.bg} border ${persona.border} flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                        {persona.icon}
                    </div>
                    <div>
                        <h3 className={`text-sm font-black uppercase tracking-widest ${persona.color} drop-shadow-sm`}>
                            {persona.name}
                        </h3>
                        <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">
                            {persona.role}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isGemini ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_8px_${isGemini ? '#10b981' : '#f59e0b'}]`}></span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isGemini ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {isGemini ? 'Gemini Live' : 'Offline'}
                        </span>
                    </div>
                    <span className="text-[8px] text-gray-500">
                        {isGemini ? 'gemini-2.0-flash' : 'rule-based fallback'}
                    </span>
                </div>
            </div>

            {/* ═══ PRIMARY DIRECTIVE CARD ═══ */}
            {primaryDirective && (
                <div className="px-4 pt-4">
                    <div className={`p-3 rounded-lg border-l-2 flex items-start gap-3 shadow-lg transition-all hover:scale-[1.01] ${primaryDirective.type === 'alert'
                        ? 'bg-rose-500/10 border-l-rose-500 border-y border-r border-rose-500/10'
                        : primaryDirective.type === 'info'
                            ? 'bg-blue-500/10 border-l-blue-500 border-y border-r border-blue-500/10'
                            : 'bg-emerald-500/10 border-l-emerald-500 border-y border-r border-emerald-500/10'}`}>
                        <div className={`mt-0.5 text-lg ${primaryDirective.type === 'alert' ? 'animate-bounce' : ''}`}>
                            {primaryDirective.type === 'alert' ? '⚠️' : primaryDirective.type === 'info' ? 'ℹ️' : '✅'}
                        </div>
                        <div>
                            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${primaryDirective.type === 'alert' ? 'text-rose-400'
                                : primaryDirective.type === 'info' ? 'text-blue-400'
                                    : 'text-emerald-400'
                                }`}>
                                {primaryDirective.title}
                            </h4>
                            <p className="text-[10px] text-gray-300 leading-relaxed font-medium">
                                {primaryDirective.desc}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ CHAT STREAM ═══ */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[11px] leading-relaxed relative shadow-md ${msg.role === 'user'
                            ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-br-none'
                            : `bg-[#1a1a1a] text-gray-300 border ${persona.border} rounded-bl-none`
                            }`}>
                            {/* AI Avatar for messages */}
                            {msg.role === 'ai' && (
                                <div className={`absolute -left-2 -top-2 w-4 h-4 rounded-full ${persona.bg} border ${persona.border} flex items-center justify-center text-[8px]`}>
                                    {persona.icon}
                                </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex gap-1 items-center">
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* ═══ INPUT FIELD ═══ */}
            <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                <div className="flex gap-2 items-center bg-[#0b0e11] border border-white/10 rounded-xl px-2 py-1 focus-within:border-blue-500/50 transition-colors shadow-inner">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={isGemini ? `Ask ${persona.name} anything...` : `Message ${persona.name}...`}
                        className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-gray-600 outline-none font-medium"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!query.trim() || isTyping}
                        className={`p-2 rounded-lg transition-all ${query.trim() && !isTyping ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' : 'text-gray-700'}`}
                    >
                        ➤
                    </button>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[9px] text-gray-600 font-mono">Strategy: {activeStrategy.name}</span>
                    <span className={`text-[9px] font-mono ${isGemini ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {isGemini ? '🧠 Gemini 2.0 Flash' : `Mode: ${marketCondition ? marketCondition.toUpperCase() : 'MANUAL'}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
