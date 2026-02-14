/**
 * SmartFolio Strategy Doctrines
 * =============================
 * Two isolated Roth IRA accounts, each with their own trading philosophy.
 * Both: Manual trading via Alto/Coinbase, 1% trade fee, spot only, tax-free gains.
 */
import type { AccountId } from './portfolio';

// ─── Shared Constants ───
export const TRADE_FEE_PERCENT = 1.0;
export const TAX_WRAPPER = 'Roth IRA (Tax-Free Gains)';
export const EXECUTION_MODE = 'MANUAL' as const;
export const EXECUTION_VIA = 'Coinbase Integration (CB-listed coins)';

// ─── Strategy Interface ───
export interface Strategy {
    name: string;
    accountLabel: string;
    targetMask: string;
    targets: {
        cash: { min: number; ideal: number; max: number; label: string };
        [key: string]: { min?: number; ideal?: number; max?: number; label: string };
    };
    rules: string[];
    thresholds: {
        profitTakeMin: number;
        profitTakeMax: number;
        dipEntryPercent: number;
        cashCriticalBelow: number;
        cashHealthyAbove: number;
        maxConcentration: number;
    };
}

// ═══════════════════════════════════════════════════
// SUI ACCOUNT STRATEGY — Aggressive Growth, SUI King
// ═══════════════════════════════════════════════════
export const SUI_STRATEGY: Strategy = {
    name: 'Aggressive Growth — SUI Anchor',
    accountLabel: 'SUI Account (#82367)',
    targetMask: '50:25:25 (SUI/ALT/USD)',

    targets: {
        sui: { min: 40, ideal: 50, max: 85, label: 'Core / King' },
        alts: { min: 0, ideal: 25, max: 35, label: 'Tactical Swings' },
        cash: { min: 10, ideal: 25, max: 40, label: 'USDC Dry Powder' },
    },

    rules: [
        'SUI is the anchor — never below ~40-45% without strong reason; compound over years.',
        'Alts are tactical swings ONLY — enter on dips, take 20-50% profits, recycle to SUI/cash.',
        'Cash at 25% is the safety net — low cash is priority #1 to rebuild.',
        'Trim SUI on strength (pumps), not weakness — ladder exits at key resistance.',
        'Recycle alt profits → SUI accumulation or cash reserve rebuild.',
        'No FOMO market buys — patience and limit orders only.',
    ],

    thresholds: {
        profitTakeMin: 20,
        profitTakeMax: 50,
        dipEntryPercent: 10,
        cashCriticalBelow: 10,
        cashHealthyAbove: 20,
        maxConcentration: 85, // SUI can go high
    },
};

// ═══════════════════════════════════════════════════
// ALTS ACCOUNT STRATEGY — Balanced Alt Rotation
// ═══════════════════════════════════════════════════
export const ALTS_STRATEGY: Strategy = {
    name: 'Balanced Alt Rotation — No King',
    accountLabel: 'Alts Account (#82263)',
    targetMask: '60-80:20-40 (ALTS/USD)',

    targets: {
        alts: { min: 50, ideal: 70, max: 80, label: 'Diversified Alts' },
        cash: { min: 20, ideal: 30, max: 40, label: 'USDC Dry Powder' },
    },

    rules: [
        'No single king — balance risk across 4-8 alt positions evenly.',
        'No alt should exceed ~20% of portfolio — rebalance on over-concentration.',
        'Cash at 20-40% is the safety net — 32% is healthy, stay in range.',
        'Swing trade dips → take profits at 30-100%+ moves → recycle to cash or new dips.',
        'Ladder buys (deep dip + closer dip) and profit-target sells on every position.',
        '1% trade fee — batch or ladder wisely, avoid churning small moves.',
        'All inside Roth = tax-free compounding. No rush, patience pays.',
    ],

    thresholds: {
        profitTakeMin: 30,
        profitTakeMax: 100,
        dipEntryPercent: 15,
        cashCriticalBelow: 15,
        cashHealthyAbove: 25,
        maxConcentration: 20,
    },
};

// ─── Strategy Registry ───
export const STRATEGIES: Record<AccountId, Strategy> = {
    sui: SUI_STRATEGY,
    alts: ALTS_STRATEGY,
};

// ─── Health Calculators ───
export type AllocationHealth = 'CRITICAL' | 'UNDER' | 'ON_TARGET' | 'OVER';

export function getCashHealth(cashPercent: number, strategy: Strategy): AllocationHealth {
    if (cashPercent < strategy.thresholds.cashCriticalBelow) return 'CRITICAL';
    if (cashPercent < strategy.thresholds.cashHealthyAbove) return 'UNDER';
    if (cashPercent > (strategy.targets.cash.max ?? 40)) return 'OVER';
    return 'ON_TARGET';
}

export function getAssetHealth(percent: number, maxConcentration: number): AllocationHealth {
    if (percent > maxConcentration + 5) return 'OVER';
    if (percent > maxConcentration) return 'ON_TARGET';
    return 'ON_TARGET';
}
