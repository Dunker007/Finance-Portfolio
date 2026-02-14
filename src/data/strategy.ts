/**
 * SmartFolio Strategy Doctrine
 * ============================
 * Account: Roth Alto CryptoIRA (#82367)
 * Mode: MANUAL TRADING (Alto has no functional APIs)
 * Tax Wrapper: Roth IRA — all gains are tax-free
 * 
 * Primary Goal: Long-term compounding of SUI as the king asset.
 * Vibe: Aggressive but patient — SUI long bias + opportunistic alt swings.
 */

// ─── Allocation Targets (soft guidelines, not rigid) ───
export const STRATEGY = {
    name: 'Aggressive Growth — SUI Anchor',
    mode: 'MANUAL' as const,
    account: 'Roth Alto CryptoIRA (#82367)',
    taxWrapper: 'Roth IRA (Tax-Free Gains)',

    targets: {
        sui: { min: 40, ideal: 50, label: 'Core / King' },
        alts: { max: 25, label: 'Tactical Swings' },
        cash: { ideal: 25, critical: 10, label: 'USDC Dry Powder' },
    },

    // Target mask string for header display
    targetMask: '50:25:25 (SUI/ALT/USD)',

    rules: [
        'SUI is the anchor — never below ~40-45% without strong reason; compound over years.',
        'Alts are tactical swings ONLY — enter on dips, take 20-50% profits, recycle to SUI/cash.',
        'Cash at 25% is the safety net — low cash is priority #1 to rebuild.',
        'Trim SUI on strength (pumps), not weakness — ladder exits at key resistance.',
        'Recycle alt profits → SUI accumulation or cash reserve rebuild.',
        'No FOMO market buys — patience and limit orders only.',
    ],

    // Action thresholds
    thresholds: {
        altProfitTakeMin: 20,   // Minimum % gain to consider trimming an alt
        altProfitTakeMax: 50,   // Strong trim zone
        altDipEntryPercent: 10, // Enter alts on ~10% pullbacks
        cashCriticalBelow: 10,  // Below this = "cash poor" emergency
        cashHealthyAbove: 20,   // Above this = shift from recovery to accumulation
    },

    // Trim strategy for SUI
    suiTrimStrategy: {
        description: 'Ladder exits at resistance levels during strength',
        exampleSplit: {
            suiDipBuysLater: 40, // % of proceeds
            altSwings: 30,
            cashReserve: 30,
        }
    }
} as const;

// ─── Allocation Status Calculator ───
export type AllocationHealth = 'CRITICAL' | 'UNDER' | 'ON_TARGET' | 'OVER';

export function getCashHealth(cashPercent: number): AllocationHealth {
    if (cashPercent < STRATEGY.thresholds.cashCriticalBelow) return 'CRITICAL';
    if (cashPercent < STRATEGY.targets.cash.ideal - 5) return 'UNDER';
    if (cashPercent > STRATEGY.targets.cash.ideal + 5) return 'OVER';
    return 'ON_TARGET';
}

export function getSuiHealth(suiPercent: number): AllocationHealth {
    if (suiPercent < STRATEGY.targets.sui.min) return 'CRITICAL';
    if (suiPercent < STRATEGY.targets.sui.ideal - 5) return 'UNDER';
    if (suiPercent > STRATEGY.targets.sui.ideal + 15) return 'OVER';
    return 'ON_TARGET';
}
