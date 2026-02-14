"use client";
import React, { useState } from 'react';
import { usePortfolio, JournalEntry } from '../context/PortfolioContext';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const SYMBOLS = ['SUI', 'LINK', 'AAVE', 'IMX', 'USD'];

export default function TradeJournal() {
    const { journal, addJournalEntry, exportData, importData, resetToDefaults } = usePortfolio();
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Form state
    const [symbol, setSymbol] = useState('SUI');
    const [type, setType] = useState<'buy' | 'sell' | 'note'>('buy');
    const [price, setPrice] = useState('');
    const [units, setUnits] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addJournalEntry({
            symbol,
            type,
            price: price ? parseFloat(price) : undefined,
            units: units ? parseFloat(units) : undefined,
            notes: notes || `${type.toUpperCase()} ${symbol}`,
        });
        // Reset form
        setPrice('');
        setUnits('');
        setNotes('');
        setIsOpen(false);
    };

    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const success = importData(reader.result as string);
                if (!success) alert('Invalid backup file.');
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    Trade Journal
                    <span className="text-[10px] font-mono text-gray-600 normal-case tracking-normal">
                        ({journal.length} entries)
                    </span>
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-[9px] font-bold text-gray-500 hover:text-gray-300 uppercase tracking-widest px-2 py-1 rounded hover:bg-white/5 transition-all"
                    >
                        ⚙
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-[10px] font-black text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-widest transition-all"
                    >
                        + Log Trade
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap gap-2">
                    <button onClick={handleExport} className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                        Export Backup
                    </button>
                    <button onClick={handleImport} className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-widest hover:bg-blue-500/20 transition-all">
                        Import Backup
                    </button>
                    <button onClick={() => { if (confirm('Reset all data to defaults? This cannot be undone.')) resetToDefaults(); }} className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest hover:bg-rose-500/20 transition-all">
                        Reset to Defaults
                    </button>
                </div>
            )}

            {/* Entry Form */}
            {isOpen && (
                <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-xl bg-white/[0.03] border border-blue-500/20 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        {/* Symbol */}
                        <select
                            value={symbol}
                            onChange={e => setSymbol(e.target.value)}
                            className="bg-[#111] text-white text-xs rounded-lg p-2 border border-white/10 focus:border-blue-500/50 outline-none"
                        >
                            {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Type Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-white/10">
                            {(['buy', 'sell', 'note'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 text-[10px] font-black uppercase py-2 transition-all ${type === t
                                        ? t === 'buy' ? 'bg-emerald-500 text-white' : t === 'sell' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Price */}
                        <input
                            type="number"
                            step="any"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="Price"
                            className="bg-[#111] text-white text-xs rounded-lg p-2 border border-white/10 focus:border-blue-500/50 outline-none font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            step="any"
                            value={units}
                            onChange={e => setUnits(e.target.value)}
                            placeholder="Units"
                            className="bg-[#111] text-white text-xs rounded-lg p-2 border border-white/10 focus:border-blue-500/50 outline-none font-mono"
                        />
                        <input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="bg-[#111] text-white text-xs rounded-lg p-2 border border-white/10 focus:border-blue-500/50 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Log Entry
                    </button>
                </form>
            )}

            {/* Journal Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                {journal.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-xs font-mono">No trades logged yet.</p>
                        <p className="text-gray-700 text-[10px] mt-1">Click "+ Log Trade" to record an Alto execution.</p>
                    </div>
                ) : (
                    journal.map((entry: JournalEntry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${entry.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : entry.type === 'sell' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                    {entry.type === 'buy' ? 'B' : entry.type === 'sell' ? 'S' : '📝'}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-white">{entry.symbol}</span>
                                        {entry.units && <span className="text-[10px] font-mono text-gray-400">{entry.units} units</span>}
                                        {entry.price && <span className="text-[10px] font-mono text-blue-400">@ {currency.format(entry.price)}</span>}
                                    </div>
                                    <span className="text-[9px] text-gray-600 italic">{entry.notes}</span>
                                </div>
                            </div>
                            <span className="text-[9px] text-gray-600 font-mono">{formatTime(entry.timestamp)}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
