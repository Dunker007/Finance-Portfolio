"use client";
import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { JournalEntry } from '../data/portfolio';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function TradeJournal() {
    const { journal, addJournalEntry, addOrder, exportData, importData, resetToDefaults, assets, pendingOrders } = usePortfolio();
    const SYMBOLS = assets.map(a => a.symbol);
    const [isOpen, setIsOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Import State
    const [importText, setImportText] = useState('');
    const [previewItems, setPreviewItems] = useState<{
        id: string;
        type: 'buy' | 'sell';
        symbol: string;
        units: number;
        price: number;
        status: 'open' | 'executed';
        date: string;
        isDuplicate: boolean;
    }[]>([]);
    const [showPreview, setShowPreview] = useState(false);

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

    // ─── Bulk Import Logic ───
    const parseAndProcessHistory = () => {
        if (!importText.trim()) return;

        const lines = importText.split(/\n/);
        let processed = 0;
        let skipped = 0;

        // Simple state machine or sliding window could work, but user pastes row-based data.
        // Format examples: 
        // "Limit Sell\n513b7d5\n1,100.00 SUI\n$1.05 Placed 2026-02-13" (multiline)
        // "Market Buy\tddb364d\t10.086776 UNI\t$34.60 USD\t$3.43\tExecuted\t2026-02-13" (tab separated)

        // We will tokenize the input and look for patterns.
        const tokenStream = importText.split(/[\t\n]/).map(s => s.trim()).filter(s => s.length > 0);

        // Regex for ID (approx 7 chars hex)
        const idRegex = /^[a-f0-9]{7}$/i;

        const newItems: typeof previewItems = [];

        for (let i = 0; i < tokenStream.length; i++) {
            const token = tokenStream[i];

            if (idRegex.test(token)) {
                const id = token;
                const isDuplicate = journal.some(j => j.id === id) || pendingOrders.some(o => o.id === id);

                // Look backwards for Type
                let type: 'buy' | 'sell' = 'buy';
                if (tokenStream[i - 1] && /sell/i.test(tokenStream[i - 1])) type = 'sell';
                else if (tokenStream[i - 1] && /buy/i.test(tokenStream[i - 1])) type = 'buy';

                // Look forwards for Units/Symbol
                let units = 0;
                let symbol = 'Unknown';
                if (tokenStream[i + 1]) {
                    const potentialUnits = tokenStream[i + 1].replace(/,/g, '');
                    if (!isNaN(parseFloat(potentialUnits))) {
                        units = parseFloat(potentialUnits);
                        if (tokenStream[i + 2]) symbol = tokenStream[i + 2];
                    } else if (tokenStream[i + 1].includes(' ')) {
                        const parts = tokenStream[i + 1].split(' ');
                        units = parseFloat(parts[0].replace(/,/g, ''));
                        symbol = parts[1];
                    }
                }

                // Look for Price & Context
                let price = 0;
                const window = tokenStream.slice(i, i + 8);
                const priceToken = window.find(s => s.startsWith('$') && !s.includes('USD'));
                if (priceToken) {
                    price = parseFloat(priceToken.replace('$', '').replace(/,/g, ''));
                }

                const isExecuted = window.some(s => /executed/i.test(s));
                const isPlaced = window.some(s => /placed/i.test(s));

                const dateRegex = /\d{4}-\d{2}-\d{2}/;
                const dateToken = window.find(s => dateRegex.test(s));
                const date = dateToken || new Date().toISOString().split('T')[0];

                if (isExecuted || isPlaced) {
                    newItems.push({
                        id,
                        type,
                        symbol: symbol.toUpperCase(),
                        units,
                        price,
                        status: isExecuted ? 'executed' : 'open',
                        date,
                        isDuplicate
                    });
                }
            }
        }

        setPreviewItems(newItems);
        setShowPreview(true);
        setIsImportOpen(false); // Close text area, show preview
    };

    const confirmImport = () => {
        let processed = 0;
        let skipped = 0;

        previewItems.forEach(item => {
            if (item.isDuplicate) {
                skipped++;
                return;
            }

            if (item.status === 'executed') {
                addJournalEntry({
                    id: item.id,
                    timestamp: new Date(item.date).toISOString(),
                    type: item.type,
                    symbol: item.symbol,
                    units: item.units,
                    price: item.price,
                    notes: 'Imported via bulk tool'
                });
            } else {
                addOrder({
                    id: item.id,
                    type: item.type,
                    symbol: item.symbol,
                    units: item.units,
                    price: item.price,
                    status: 'open',
                    date: item.date,
                    note: 'Imported via bulk tool'
                });
            }
            processed++;
        });

        alert(`Import Complete:\n• ${processed} new entries added.\n• ${skipped} duplicates identified and skipped.`);
        setImportText('');
        setShowPreview(false);
        setPreviewItems([]);
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
        <div className="flex flex-col h-full relative">
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
                        onClick={() => setIsImportOpen(true)}
                        className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest transition-all"
                    >
                        Paste History
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-[10px] font-black text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 uppercase tracking-widest transition-all"
                    >
                        + Log Trade
                    </button>
                </div>
            </div>

            {/* Paste Import Modal */}
            {isImportOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-[#0b0e11] flex flex-col p-4 rounded-xl border border-white/10 animate-fade-in-up shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Paste Browser Data</h4>
                            <button onClick={() => setIsImportOpen(false)} className="text-xs text-gray-400 hover:text-white">✕</button>
                        </div>
                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder="Paste rows from your browser history here..."
                            className="h-64 bg-[#111] text-[10px] font-mono p-3 rounded-lg border border-white/10 resize-none outline-none focus:border-emerald-500/50 mb-4"
                        />
                        <button
                            onClick={parseAndProcessHistory}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                        >
                            Review Import
                        </button>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg max-h-[85vh] bg-[#0b0e11] flex flex-col p-4 rounded-xl border border-white/10 animate-fade-in-up shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                Verify Import ({previewItems.filter(i => !i.isDuplicate).length} New)
                            </h4>
                            <button onClick={() => { setShowPreview(false); setPreviewItems([]); }} className="text-xs text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar border border-white/5 rounded-lg p-2 bg-[#111] mb-4">
                            {previewItems.length === 0 ? <span className="text-xs text-gray-500">No valid entries found in text.</span> :
                                previewItems.map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-2 rounded border text-[10px] ${item.isDuplicate ? 'bg-rose-500/5 border-rose-500/20 opacity-60' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold uppercase ${item.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.type}</span>
                                            <span className="font-black text-white">{item.units} {item.symbol}</span>
                                            <span className="text-gray-400">@ {currency.format(item.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-gray-500">{item.id}</span>
                                            {item.isDuplicate
                                                ? <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Skip</span>
                                                : <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">New</span>
                                            }
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowPreview(false); setIsImportOpen(true); }}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                            >
                                Back
                            </button>
                            {previewItems.some(i => !i.isDuplicate) ? (
                                <button
                                    onClick={confirmImport}
                                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                >
                                    Confirm Import ({previewItems.filter(i => !i.isDuplicate).length})
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewItems([]); }}
                                    className="flex-[2] py-3 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                >
                                    Finish (0 New Entries)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
