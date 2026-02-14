"use client";
import React, { useState, useEffect } from 'react';
import { getGeminiKey, setGeminiKey, validateKey, hasGeminiKey } from '@/lib/geminiService';
import { usePortfolio } from '@/context/PortfolioContext';

type KeyStatus = 'idle' | 'testing' | 'valid' | 'invalid';

export default function SettingsPage() {
    const { exportData, importData, resetToDefaults, activeAccount } = usePortfolio();
    const [mounted, setMounted] = useState(false);
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [keyStatus, setKeyStatus] = useState<KeyStatus>('idle');
    const [importJson, setImportJson] = useState('');
    const [importResult, setImportResult] = useState<'success' | 'error' | null>(null);
    const [exportCopied, setExportCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
        const existing = getGeminiKey();
        if (existing) {
            setGeminiKeyInput(existing);
            setKeyStatus('valid'); // Assume valid if exists
        }
    }, []);

    const handleSaveKey = async () => {
        const key = geminiKeyInput.trim();
        if (!key) return;
        setKeyStatus('testing');
        const isValid = await validateKey(key);
        if (isValid) {
            setGeminiKey(key);
            setKeyStatus('valid');
        } else {
            setKeyStatus('invalid');
        }
    };

    const handleExport = () => {
        const json = exportData();
        navigator.clipboard.writeText(json);
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2000);
    };

    const handleImport = () => {
        if (!importJson.trim()) return;
        const ok = importData(importJson.trim());
        setImportResult(ok ? 'success' : 'error');
        if (ok) setImportJson('');
        setTimeout(() => setImportResult(null), 3000);
    };

    const maskKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '••••••••';
        return key.slice(0, 4) + '••••••••••••••••••••' + key.slice(-4);
    };

    if (!mounted) return null;

    return (
        <>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-900/40 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-900/30 blur-[150px] rounded-full animate-pulse delay-1000"></div>
            </div>

            <header className="h-16 flex items-center justify-between px-4 pl-16 lg:pl-8 lg:px-8 glass-panel z-50 shrink-0 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-3">
                    <span className="text-lg">⚙️</span>
                    <span className="text-sm font-black text-white uppercase tracking-widest">Settings</span>
                    <div className="h-4 w-px bg-white/10 mx-2"></div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">API Keys • Data • Config</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth custom-scrollbar">
                {/* ═══ GEMINI API KEY ═══ */}
                <section className="glass-card p-6 space-y-4 animate-fade-in-up border-l-4 border-l-blue-500/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
                                🧠
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Gemini AI</h3>
                                <span className="text-[9px] text-gray-500 font-mono">Google Gemini 2.0 Flash • Powers AI Analyst</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {keyStatus === 'valid' && (
                                <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    CONNECTED
                                </span>
                            )}
                            {keyStatus === 'invalid' && (
                                <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                                    INVALID KEY
                                </span>
                            )}
                            {keyStatus === 'testing' && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 animate-pulse">
                                    TESTING...
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">API Key</label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={showKey ? geminiKeyInput : (geminiKeyInput ? maskKey(geminiKeyInput) : '')}
                                    onChange={e => { setGeminiKeyInput(e.target.value); setKeyStatus('idle'); }}
                                    onFocus={() => setShowKey(true)}
                                    onBlur={() => setTimeout(() => setShowKey(false), 200)}
                                    placeholder="AIza..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-blue-500/50 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleSaveKey}
                                disabled={!geminiKeyInput.trim() || keyStatus === 'testing'}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${geminiKeyInput.trim() && keyStatus !== 'testing'
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed'
                                    }`}
                            >
                                {keyStatus === 'testing' ? 'Testing...' : 'Save & Test'}
                            </button>
                        </div>
                        <p className="text-[9px] text-gray-600 font-mono">
                            Get your key at{' '}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                                aistudio.google.com/apikey
                            </a>
                            {' • '}Stored in browser localStorage only. Never sent to any server except Google AI.
                        </p>
                    </div>
                </section>

                {/* ═══ DATA MANAGEMENT ═══ */}
                <section className="glass-card p-6 space-y-4 animate-fade-in-up delay-75">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">
                            💾
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Data Management</h3>
                            <span className="text-[9px] text-gray-500 font-mono">Export • Import • Reset — Account: {activeAccount.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Export */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Export Portfolio</h4>
                            <p className="text-[9px] text-gray-600">Copy current account data (assets, orders, journal) as JSON to clipboard.</p>
                            <button
                                onClick={handleExport}
                                className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${exportCopied
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {exportCopied ? '✓ Copied to Clipboard' : '📋 Export JSON'}
                            </button>
                        </div>

                        {/* Import */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Import Portfolio</h4>
                            <textarea
                                value={importJson}
                                onChange={e => setImportJson(e.target.value)}
                                placeholder='Paste JSON export here...'
                                rows={3}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono text-white outline-none focus:border-purple-500/50 resize-none"
                            />
                            <button
                                onClick={handleImport}
                                disabled={!importJson.trim()}
                                className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${importResult === 'success'
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : importResult === 'error'
                                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                            : importJson.trim()
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                                                : 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed'
                                    }`}
                            >
                                {importResult === 'success' ? '✓ Imported' : importResult === 'error' ? '✗ Invalid JSON' : '📥 Import'}
                            </button>
                        </div>

                        {/* Reset */}
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-rose-500/10 space-y-3">
                            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">⚠️ Reset Account</h4>
                            <p className="text-[9px] text-gray-600">Reset {activeAccount.toUpperCase()} account back to seed data. This clears all local changes (orders, journal entries, balance syncs).</p>
                            <button
                                onClick={() => {
                                    if (confirm(`Reset ${activeAccount.toUpperCase()} account to defaults? This cannot be undone.`)) {
                                        resetToDefaults();
                                    }
                                }}
                                className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white"
                            >
                                🗑️ Reset to Defaults
                            </button>
                        </div>
                    </div>
                </section>

                {/* ═══ SYSTEM INFO ═══ */}
                <section className="glass-card p-6 space-y-4 animate-fade-in-up delay-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                            📊
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">System</h3>
                            <span className="text-[9px] text-gray-500 font-mono">SmartFolio v2.0 • Phase 2</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Storage', value: 'localStorage', status: 'active' },
                            { label: 'Gemini AI', value: hasGeminiKey() ? 'Connected' : 'Not configured', status: hasGeminiKey() ? 'active' : 'inactive' },
                            { label: 'Price Feed', value: 'Coinbase (Public)', status: 'active' },
                            { label: 'Logos', value: 'CoinGecko', status: 'active' },
                        ].map(s => (
                            <div key={s.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                <div>
                                    <span className="text-[8px] text-gray-600 uppercase tracking-wider block">{s.label}</span>
                                    <span className="text-[10px] font-bold text-white">{s.value}</span>
                                </div>
                                <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-[9px] text-gray-600 font-mono block mb-1">Stack</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                            Next.js 15 • React 19 • Tailwind v4 • Gemini 2.0 Flash • Coinbase API • CoinGecko API • TradingView Widgets
                        </span>
                    </div>
                </section>

                <div className="h-10"></div>
            </main>
        </>
    );
}
