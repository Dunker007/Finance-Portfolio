"use client";
import React, { useState, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { ACCOUNTS, AccountId, LOGO_MAPPING } from '@/data/portfolio';
import { TRADE_FEE_PERCENT } from '@/data/strategy';


const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function OrderBuilderPage() {
    const {
        assets, pendingOrders, activeAccount, activeStrategy,
        addOrder, fillOrder, killOrder, mounted, importAsset
    } = usePortfolio();

    // ─── Manual Workflow Helpers ───
    const copyToClipboard = (txt: string | number) => {
        if (!txt) return;
        navigator.clipboard.writeText(String(txt));
        // Could add toast here but simple is fine
    };

    // ─── Order form state ───
    const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
    const [symbol, setSymbol] = useState('');
    const [units, setUnits] = useState('');
    const [price, setPrice] = useState('');
    const [note, setNote] = useState('');

    // Import state
    const [showImport, setShowImport] = useState(false);
    const [importSymbol, setImportSymbol] = useState('');

    // ─── Ladder builder state ───
    const [ladderMode, setLadderMode] = useState(false);
    const [ladderSymbol, setLadderSymbol] = useState('');
    const [ladderType, setLadderType] = useState<'buy' | 'sell'>('sell');
    const [ladderUnitsEach, setLadderUnitsEach] = useState('');
    const [ladderPriceStart, setLadderPriceStart] = useState('');
    const [ladderPriceEnd, setLadderPriceEnd] = useState('');
    const [ladderSteps, setLadderSteps] = useState('3');
    const [ladderNote, setLadderNote] = useState('');

    // ─── Simulation State ───
    const [simulatedOrderIds, setSimulatedOrderIds] = useState<Set<string>>(new Set());

    const toggleSimulation = (id: string) => {
        setSimulatedOrderIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const [mounted2, setMounted2] = useState(false);
    React.useEffect(() => setMounted2(true), []);

    const symbols = useMemo(() => assets.filter(a => a.symbol !== 'USD').map(a => a.symbol), [assets]);

    // ─── All orders across both accounts ───
    const allOrders = useMemo(() => {
        const activeOrders = pendingOrders.map(o => ({ ...o, account: activeAccount }));
        // For the other account, read from seed data
        const otherId: AccountId = activeAccount === 'sui' ? 'alts' : 'sui';
        const otherOrders = ACCOUNTS[otherId].pendingOrders.map(o => ({ ...o, account: otherId }));
        return [...activeOrders, ...otherOrders];
    }, [pendingOrders, activeAccount]);

    // ─── Fee preview ───
    const previewUnits = parseFloat(units) || 0;
    const previewPrice = parseFloat(price) || 0;
    const previewGross = previewUnits * previewPrice;
    const previewFee = previewGross * (TRADE_FEE_PERCENT / 100);
    const previewNet = orderType === 'buy' ? previewGross + previewFee : previewGross - previewFee;

    // ─── Ladder preview ───
    const ladderPreview = useMemo(() => {
        const steps = parseInt(ladderSteps) || 0;
        const start = parseFloat(ladderPriceStart) || 0;
        const end = parseFloat(ladderPriceEnd) || 0;
        const unitsEach = parseFloat(ladderUnitsEach) || 0;
        if (steps < 2 || !start || !end || !unitsEach) return [];
        const increment = (end - start) / (steps - 1);
        return Array.from({ length: steps }, (_, i) => {
            const p = start + increment * i;
            const gross = unitsEach * p;
            const fee = gross * (TRADE_FEE_PERCENT / 100);
            return { price: p, units: unitsEach, gross, fee, net: ladderType === 'sell' ? gross - fee : gross + fee };
        });
    }, [ladderSteps, ladderPriceStart, ladderPriceEnd, ladderUnitsEach, ladderType]);

    // ─── Simulation Metrics ───
    const simulationMetrics = useMemo(() => {
        let cashChange = 0;
        let totalFees = 0;

        allOrders.forEach(order => {
            if (simulatedOrderIds.has(order.id)) {
                const gross = order.units * order.price;
                const fee = gross * (TRADE_FEE_PERCENT / 100);
                totalFees += fee;

                if (order.type === 'buy') {
                    cashChange -= (gross + fee);
                } else {
                    cashChange += (gross - fee);
                }
            }
        });

        return { cashChange, totalFees };
    }, [allOrders, simulatedOrderIds]);

    const handleSubmitOrder = () => {
        if (!symbol || !previewUnits || !previewPrice) return;
        addOrder({ type: orderType, symbol, units: previewUnits, price: previewPrice, note: note || undefined });
        setUnits(''); setPrice(''); setNote('');
    };

    const handleSubmitLadder = () => {
        if (!ladderSymbol || ladderPreview.length === 0) return;
        ladderPreview.forEach((step, i) => {
            addOrder({
                type: ladderType,
                symbol: ladderSymbol,
                units: parseFloat(step.units.toFixed(step.price < 1 ? 2 : 4)), // Fix units precision if needed
                price: parseFloat(step.price.toFixed(step.price < 1 ? 6 : 4)),
                note: ladderNote ? `${ladderNote} (rung ${i + 1}/${ladderPreview.length})` : `Ladder ${i + 1}/${ladderPreview.length}`,
            });
        });
        setLadderUnitsEach(''); setLadderPriceStart(''); setLadderPriceEnd(''); setLadderNote('');
    };

    // ─── Auto-Populate Ladder Defaults ───
    React.useEffect(() => {
        const tgt = assets.find(a => a.symbol === ladderSymbol);
        if (tgt && tgt.currentPrice > 0) {
            const p = tgt.currentPrice;
            const decimals = p < 1 ? 6 : 2;
            if (ladderType === 'buy') {
                // Dip Buy: -5% to -15%
                setLadderPriceStart((p * 0.95).toFixed(decimals));
                setLadderPriceEnd((p * 0.85).toFixed(decimals));
            } else {
                // Profit Sell: +5% to +20%
                setLadderPriceStart((p * 1.05).toFixed(decimals));
                setLadderPriceEnd((p * 1.20).toFixed(decimals));
            }
        }
    }, [ladderSymbol, ladderType, assets]);

    if (!mounted || !mounted2) return null;

    return (
        <>
            {/* Header */}
            <header className="h-14 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 z-30 sticky top-0">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🛒</span>
                    <h1 className="text-sm font-black text-white uppercase tracking-widest">Order Builder</h1>
                    <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {activeStrategy.name.split('—')[0].trim()} • {TRADE_FEE_PERCENT}% per trade
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-500 font-mono">{pendingOrders.length} active orders</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Mode toggle */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLadderMode(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${!ladderMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        Single Order
                    </button>
                    <button
                        onClick={() => setLadderMode(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${ladderMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                            }`}
                    >
                        Ladder Builder
                    </button>
                </div>

                {!ladderMode ? (
                    /* ═══ SINGLE ORDER ═══ */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 glass-card p-6 space-y-5">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">New Limit Order</h3>

                            {/* Buy / Sell toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setOrderType('buy')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all border ${orderType === 'buy'
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                        : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={() => setOrderType('sell')}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all border ${orderType === 'sell'
                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                                        : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Symbol */}
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Asset</label>
                                <div className="flex gap-2">
                                    <select
                                        value={symbol}
                                        onChange={e => setSymbol(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                    >
                                        <option value="" className="bg-black">Select asset...</option>
                                        {symbols.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                                    </select>
                                    <button
                                        onClick={() => setShowImport(!showImport)}
                                        className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 font-bold transition-all text-xl"
                                        title="Import New Token"
                                    >
                                        +
                                    </button>
                                </div>
                                {showImport && (
                                    <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2 items-center animate-fade-in-up">
                                        <input
                                            value={importSymbol}
                                            onChange={e => setImportSymbol(e.target.value.toUpperCase())}
                                            placeholder="SYMBOL (e.g. BONK)"
                                            onKeyDown={async e => {
                                                if (e.key === 'Enter' && importSymbol) {
                                                    await importAsset(importSymbol);
                                                    setSymbol(importSymbol);
                                                    setShowImport(false);
                                                    setImportSymbol('');
                                                }
                                            }}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-blue-500/50"
                                            autoFocus
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!importSymbol) return;
                                                await importAsset(importSymbol);
                                                setSymbol(importSymbol);
                                                setShowImport(false);
                                                setImportSymbol('');
                                            }}
                                            className="text-[10px] bg-blue-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-600 uppercase tracking-wider"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Units + Price row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Units</label>
                                    <input
                                        type="number" value={units} onChange={e => setUnits(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Limit Price ($)</label>
                                    <input
                                        type="number" value={price} onChange={e => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            {/* Current price hint */}
                            {symbol && (
                                <div className="text-[9px] text-gray-600 font-mono">
                                    Current spot: {currency.format(assets.find(a => a.symbol === symbol)?.currentPrice || 0)}
                                    {' • '}
                                    <button onClick={() => setPrice(String(assets.find(a => a.symbol === symbol)?.currentPrice || 0))} className="text-blue-400 hover:text-blue-300 underline">
                                        Use spot
                                    </button>
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Note (optional)</label>
                                <input
                                    type="text" value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="Thesis or trigger..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-blue-500/50"
                                />
                            </div>

                            {/* Submit Row */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={!symbol || !previewUnits || !previewPrice}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all border ${symbol && previewUnits && previewPrice
                                        ? orderType === 'buy'
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                            : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                                        : 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed'
                                        }`}
                                >
                                    Stage {orderType === 'buy' ? 'Buy' : 'Sell'} Order
                                </button>

                                {orderType === 'buy' && (
                                    <button
                                        onClick={() => {
                                            const total = parseFloat(units);
                                            // Smart Entry requires Symbol + Units. Price is optional (defaults to spot).
                                            if (!symbol || !total) return;

                                            const asset = assets.find(a => a.symbol === symbol);
                                            const spot = asset?.currentPrice || 0;
                                            const basePrice = parseFloat(price) || spot;
                                            if (!basePrice) return;

                                            // 1. Initial 50% @ Base
                                            addOrder({ type: 'buy', symbol, units: total * 0.50, price: basePrice, note: 'Smart Entry: Initial (50%)' });

                                            // 2. DCA 1 (25%) @ -12.5% (Mid of 10-15%)
                                            const p1 = parseFloat((basePrice * 0.875).toFixed(basePrice < 1 ? 6 : 4));
                                            addOrder({ type: 'buy', symbol, units: total * 0.25, price: p1, note: 'Smart Entry: DCA 1 (-12.5%)' });

                                            // 3. DCA 2 (25%) @ -25% (Mid of 20-30%)
                                            const p2 = parseFloat((basePrice * 0.75).toFixed(basePrice < 1 ? 6 : 4));
                                            addOrder({ type: 'buy', symbol, units: total * 0.25, price: p2, note: 'Smart Entry: DCA 2 (-25%)' });

                                            setUnits(''); setPrice(''); setNote('');
                                        }}
                                        disabled={!symbol || !previewUnits}
                                        className={`px-3 py-1 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center leading-tight min-w-[80px] ${symbol && previewUnits
                                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                                : 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed'
                                            }`}
                                        title="Split: 50% @ Price, 25% @ -12.5%, 25% @ -25%"
                                    >
                                        <span>Smart</span>
                                        <span className="opacity-70 text-[8px]">50/25/25</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Fee preview panel */}
                        <div className="lg:col-span-5 glass-card p-6 space-y-5 h-fit">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Order Preview</h3>

                            {previewGross > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                                        <PreviewRow label="Gross Value" value={currency.format(previewGross)} />
                                        <PreviewRow label={`Est. Fee (${TRADE_FEE_PERCENT}%)`} value={`-${currency.format(previewFee)}`} color="text-amber-400" />
                                        <div className="border-t border-white/5 pt-2">
                                            <PreviewRow
                                                label={orderType === 'buy' ? 'Total Cost' : 'Net Proceeds'}
                                                value={currency.format(previewNet)}
                                                color="text-white"
                                                bold
                                            />
                                        </div>
                                        <div className="border-t border-white/5 pt-2">
                                            <PreviewRow
                                                label="Break-even Price"
                                                value={currency.format(orderType === 'buy' ? previewPrice * 1.0203 : previewPrice * 0.9798)}
                                                color="text-purple-400"
                                            />
                                            <span className="text-[9px] text-gray-600 italic block text-right mt-1">Covering 1% buy + 1% sell</span>
                                        </div>
                                    </div>

                                    {/* Impact preview */}
                                    {symbol && (
                                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                                            <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Impact Preview</span>
                                            <PortfolioImpact symbol={symbol} orderType={orderType} gross={previewGross} fee={previewFee} assets={assets} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 text-xs font-mono">Fill out the form to see preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ═══ LADDER BUILDER ═══ */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5 glass-card p-6 space-y-5">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Ladder Configuration</h3>

                            <div className="flex gap-2">
                                <button onClick={() => setLadderType('sell')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${ladderType === 'sell' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                >Sell Ladder</button>
                                <button onClick={() => setLadderType('buy')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${ladderType === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                >Buy Ladder</button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Asset</label>
                                <select value={ladderSymbol} onChange={e => setLadderSymbol(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                >
                                    <option value="" className="bg-black">Select...</option>
                                    {symbols.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Units per rung</label>
                                <input type="number" value={ladderUnitsEach} onChange={e => setLadderUnitsEach(e.target.value)}
                                    placeholder="100"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Start Price ($)</label>
                                    <input type="number" value={ladderPriceStart} onChange={e => setLadderPriceStart(e.target.value)}
                                        placeholder="4.00" step="0.01"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">End Price ($)</label>
                                    <input type="number" value={ladderPriceEnd} onChange={e => setLadderPriceEnd(e.target.value)}
                                        placeholder="7.00" step="0.01"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Rungs (steps)</label>
                                <input type="number" value={ladderSteps} onChange={e => setLadderSteps(e.target.value)}
                                    min="2" max="10"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Note</label>
                                <input type="text" value={ladderNote} onChange={e => setLadderNote(e.target.value)}
                                    placeholder="Ladder exit strategy..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 outline-none focus:border-blue-500/50"
                                />
                            </div>

                            <button onClick={handleSubmitLadder} disabled={!ladderSymbol || ladderPreview.length === 0}
                                className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all border ${ladderSymbol && ladderPreview.length > 0
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                                    : 'bg-white/5 text-gray-600 border-white/10 cursor-not-allowed'
                                    }`}
                            >
                                Stage {ladderPreview.length} Orders
                            </button>
                        </div>

                        {/* Ladder preview */}
                        <div className="lg:col-span-7 glass-card p-6 space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Ladder Preview</h3>
                            {ladderPreview.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        {ladderPreview.map((step, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${ladderType === 'sell' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => copyToClipboard(step.units)} className="text-xs font-mono font-bold text-white hover:text-blue-400" title="Copy Units">
                                                                {step.units} units
                                                            </button>
                                                            <span className="text-gray-600">@</span>
                                                            <button onClick={() => copyToClipboard(step.price)} className="text-xs font-mono font-bold text-white hover:text-blue-400" title="Copy Price">
                                                                {currency.format(step.price)}
                                                            </button>
                                                        </div>
                                                        <span className="text-[9px] text-gray-600 font-mono">Gross: {currency.format(step.gross)} • Fee: {currency.format(step.fee)}</span>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black font-mono text-white">{currency.format(step.net)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                                        <PreviewRow label="Total Gross" value={currency.format(ladderPreview.reduce((s, r) => s + r.gross, 0))} />
                                        <PreviewRow label="Total Fees" value={`-${currency.format(ladderPreview.reduce((s, r) => s + r.fee, 0))}`} color="text-amber-400" />
                                        <div className="border-t border-white/5 pt-2">
                                            <PreviewRow label="Total Net" value={currency.format(ladderPreview.reduce((s, r) => s + r.net, 0))} color="text-white" bold />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-gray-600 text-xs font-mono">Configure ladder to see preview</p>
                                    <p className="text-gray-700 text-[10px] font-mono mt-2">Set asset, units, price range, and steps</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ CROSS-ACCOUNT ORDER BOOK ═══ */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">All Staged Orders</h3>
                        <div className="flex items-center gap-3">
                            {simulatedOrderIds.size > 0 && (
                                <span className="text-[10px] font-black text-amber-400 animate-pulse uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    Simulating {simulatedOrderIds.size} Order(s)
                                </span>
                            )}
                            <span className="text-[9px] text-gray-600 font-mono">{allOrders.length} orders across {new Set(allOrders.map(o => o.account)).size} account(s)</span>
                        </div>
                    </div>

                    {allOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600 text-xs font-mono">No staged orders yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Account</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Asset</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Units</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Value</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Fee</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">Note</th>
                                        <th className="p-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {allOrders.map(order => {
                                        const gross = order.units * order.price;
                                        const fee = gross * (TRADE_FEE_PERCENT / 100);
                                        const isActive = order.account === activeAccount;

                                        // Anomaly Detection
                                        const currentAsset = assets.find(a => a.symbol === order.symbol);
                                        const currentPrice = currentAsset?.currentPrice || 0;
                                        const deviation = currentPrice > 0 ? Math.abs((order.price - currentPrice) / currentPrice) : 0;
                                        const isAnomaly = deviation > 0.5; // >50% off market

                                        const isSimulated = simulatedOrderIds.has(order.id);

                                        return (
                                            <tr key={order.id} className={`hover:bg-white/[0.03] transition-all ${!isActive ? 'opacity-50' : ''} ${isSimulated ? 'bg-amber-500/5' : ''}`}>
                                                <td className="p-3 text-[10px] font-mono text-gray-400">{order.account === 'sui' ? '👑 SUI' : '🔄 ALTS'}</td>
                                                <td className="p-3">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${order.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                        {order.type}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {LOGO_MAPPING[order.symbol] && (
                                                            <img src={LOGO_MAPPING[order.symbol]} alt={order.symbol} className="w-4 h-4" />
                                                        )}
                                                        <span className="text-xs font-black text-white">{order.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-xs font-mono text-gray-300">
                                                    <button onClick={() => copyToClipboard(order.units)} className="hover:text-white transition-colors border-b border-transparent hover:border-gray-500" title="Copy Units">
                                                        {order.units.toLocaleString()}
                                                    </button>
                                                </td>
                                                <td className="p-3 text-right text-xs font-mono relative group">
                                                    <div className={`flex items-center justify-end gap-1 ${isAnomaly ? 'text-amber-400' : 'text-blue-400'}`}>
                                                        {isAnomaly && <span className="text-[10px]">⚠️</span>}
                                                        <button onClick={() => copyToClipboard(order.price)} className="hover:text-white transition-colors border-b border-transparent hover:border-blue-400" title="Copy Price">
                                                            {currency.format(order.price)}
                                                        </button>
                                                    </div>
                                                    {isAnomaly && (
                                                        <div className="absolute right-0 top-8 bg-black/90 border border-amber-500/30 p-2 rounded-lg text-[9px] text-amber-200 z-50 whitespace-nowrap hidden group-hover:block">
                                                            Suspicious Price! Market is {currency.format(currentPrice)}<br />
                                                            Deviation: {(deviation * 100).toFixed(0)}%
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right text-xs font-mono text-white">{currency.format(gross)}</td>
                                                <td className="p-3 text-right text-xs font-mono text-amber-400">{currency.format(fee)}</td>
                                                <td className="p-3 text-[10px] text-gray-500 max-w-[200px] truncate italic">{order.note || '—'}</td>
                                                <td className="p-3 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => toggleSimulation(order.id)}
                                                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${isSimulated ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                                                    >
                                                        {isSimulated ? 'Simulating' : 'Sim'}
                                                    </button>
                                                    {isActive && (
                                                        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 ml-2">
                                                            <button onClick={() => fillOrder(order.id)}
                                                                className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white text-[8px] font-black uppercase transition-all border border-blue-500/20"
                                                            >Fill</button>
                                                            <button onClick={() => killOrder(order.id)}
                                                                className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[8px] font-black uppercase transition-all border border-red-500/20"
                                                            >Kill</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Fee summary & Simulation Result */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[9px] font-mono">
                            <span className="text-gray-500">Total staged value: <span className="text-white font-bold">{currency.format(allOrders.reduce((s, o) => s + o.units * o.price, 0))}</span></span>
                            <span className="text-amber-400">Total fee drag: {currency.format(allOrders.reduce((s, o) => s + o.units * o.price * TRADE_FEE_PERCENT / 100, 0))}</span>
                        </div>

                        {simulatedOrderIds.size > 0 && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono space-y-2 animate-fade-in-up">
                                <h4 className="font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <span>⚡ Simulated Impact</span>
                                    <button onClick={() => setSimulatedOrderIds(new Set())} className="text-[9px] text-gray-400 hover:text-white underline">Clear</button>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-[10px]">Net Cash Change</p>
                                        <p className={`font-bold ${simulationMetrics.cashChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {simulationMetrics.cashChange >= 0 ? '+' : ''}{currency.format(simulationMetrics.cashChange)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px]">Total Fees</p>
                                        <p className="text-amber-400 font-bold">-{currency.format(simulationMetrics.totalFees)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

// ─── Helper components ───

function PreviewRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
            <span className={`text-xs font-mono ${bold ? 'font-black' : 'font-bold'} ${color || 'text-gray-300'}`}>{value}</span>
        </div>
    );
}

function PortfolioImpact({ symbol, orderType, gross, fee, assets }: {
    symbol: string; orderType: 'buy' | 'sell'; gross: number; fee: number;
    assets: { symbol: string; currentValue: number; allocation: number }[];
}) {
    const totalValue = assets.reduce((s, a) => s + a.currentValue, 0);
    const currentAsset = assets.find(a => a.symbol === symbol);
    const currentAlloc = currentAsset?.allocation || 0;

    // Simulated new allocation
    const newAssetValue = orderType === 'buy'
        ? (currentAsset?.currentValue || 0) + gross
        : Math.max(0, (currentAsset?.currentValue || 0) - gross);
    const newCashValue = orderType === 'buy'
        ? (assets.find(a => a.symbol === 'USD')?.currentValue || 0) - gross - fee
        : (assets.find(a => a.symbol === 'USD')?.currentValue || 0) + gross - fee;
    const newTotal = totalValue - fee; // fees reduce total
    const newAlloc = (newAssetValue / newTotal) * 100;
    const newCashAlloc = (newCashValue / newTotal) * 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[9px]">
                <span className="text-gray-500">{symbol} allocation</span>
                <span className="text-white font-mono">{currentAlloc.toFixed(1)}% → <span className={newAlloc > currentAlloc ? 'text-emerald-400' : 'text-rose-400'}>{newAlloc.toFixed(1)}%</span></span>
            </div>
            <div className="flex justify-between text-[9px]">
                <span className="text-gray-500">Cash after</span>
                <span className={`font-mono ${newCashAlloc < 10 ? 'text-rose-400' : 'text-white'}`}>{newCashAlloc.toFixed(1)}%{newCashAlloc < 10 ? ' ⚠️' : ''}</span>
            </div>
        </div>
    );
}
