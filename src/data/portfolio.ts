export type AccountId = 'sui' | 'alts';

export interface Asset {
    symbol: string;
    name: string;
    units: number;
    avgCost: number | null;
    currentPrice: number;
    currentValue: number;
    totalCost: number | null;
    gainLoss: number | null;
    allocation: number;
    targetAllocation: number;
    logo?: string;
}

export interface Order {
    id: string;
    type: 'buy' | 'sell';
    symbol: string;
    units: number;
    price: number;
    status: 'open' | 'filled' | 'cancelled';
    date: string;
    note?: string;
}

export interface AccountData {
    accountId: AccountId;
    accountName: string;
    accountNumber: string;
    totalValue: number;
    cashBalance: number;
    availableCash: number;
    totalGainLoss: number;
    assets: Asset[];
    recycledToSui: number;
    marketTrends: Record<string, number[]>;
    pendingOrders: Order[];
}

// ─── Logo Mappings ───
export const LOGO_MAPPING: Record<string, string> = {
    // SUI Account
    'SUI': 'https://cryptologos.cc/logos/sui-sui-logo.svg',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
    'AAVE': 'https://cryptologos.cc/logos/aave-aave-logo.svg',
    'IMX': 'https://cryptologos.cc/logos/immutable-x-imx-logo.svg',
    'USD': 'https://cryptologos.cc/logos/tether-usdt-logo.svg',
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg',
    // Alts Account
    'ONDO': 'https://cryptologos.cc/logos/ondo-finance-ondo-logo.svg',
    'RENDER': 'https://cryptologos.cc/logos/render-token-rndr-logo.svg',
    'FET': 'https://cryptologos.cc/logos/fetch-ai-fet-logo.svg',
    'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.svg',
    'HYPE': 'https://cryptologos.cc/logos/hyperliquid-hype-logo.svg',
};

// ═══════════════════════════════════════════════════
// SUI ACCOUNT — Roth Alto #82367 ("Small Account")
// ═══════════════════════════════════════════════════
export const SUI_ACCOUNT_DATA: AccountData = {
    accountId: 'sui',
    accountName: 'SUI Account',
    accountNumber: '#82367',
    totalValue: 3589.45,
    cashBalance: 201.20,
    availableCash: 1.21,
    totalGainLoss: -810.22,

    assets: [
        {
            symbol: "SUI", name: "Sui",
            units: 3012.10, avgCost: 1.24, currentPrice: 0.9825,
            currentValue: 2959.38, totalCost: 3735.00, gainLoss: -775.62,
            allocation: 82.45, targetAllocation: 50.00,
            logo: LOGO_MAPPING['SUI']
        },
        {
            symbol: "LINK", name: "Chainlink",
            units: 16.82, avgCost: 8.90, currentPrice: 8.88,
            currentValue: 149.36, totalCost: 149.75, gainLoss: -0.39,
            allocation: 4.16, targetAllocation: 8.33,
            logo: LOGO_MAPPING['LINK']
        },
        {
            symbol: "AAVE", name: "Aave",
            units: 1.241, avgCost: 120.60, currentPrice: 121.05,
            currentValue: 150.22, totalCost: 149.66, gainLoss: 0.56,
            allocation: 4.18, targetAllocation: 8.33,
            logo: LOGO_MAPPING['AAVE']
        },
        {
            symbol: "IMX", name: "ImmutableX",
            units: 877.38, avgCost: 0.17, currentPrice: 0.1685,
            currentValue: 147.84, totalCost: 149.76, gainLoss: -1.92,
            allocation: 4.12, targetAllocation: 8.34,
            logo: LOGO_MAPPING['IMX']
        },
        {
            symbol: "USD", name: "Cash Reserve (USDC)",
            units: 201.20, avgCost: 1, currentPrice: 1,
            currentValue: 201.20, totalCost: 201.20, gainLoss: 0,
            allocation: 5.60, targetAllocation: 25.00,
            logo: LOGO_MAPPING['USD']
        }
    ],

    recycledToSui: 450.00,
    marketTrends: {
        SUI: [0.95, 0.98, 0.99, 1.00, 1.02, 1.03, 1.02], // Trending up towards 1.05
        LINK: [8.20, 8.40, 8.35, 8.60, 8.75, 8.88, 8.95],
        AAVE: [110, 112, 115, 118, 122, 120, 121]
    },
    pendingOrders: [
        { id: 'sui-trim-1', type: 'sell', symbol: 'SUI', units: 1100.00, price: 1.05, status: 'open', date: '2026-02-13', note: 'Trim 1/3 of position @ 1.05 (King Rule: Trim Strength)' },
        // Keep other pending alts in SUI account if valid, but user didn't mention them explicitly. 
        // User mentioned "swing 2-3 alts (LINK/AAVE/IMX examples)".
        // I'll keep the existing ones as they add flavor:
        { id: '41dad42', type: 'buy', symbol: 'LINK', units: 6.06, price: 7.923, status: 'open', date: '2026-02-13', note: 'Dip entry for LINK' },
        { id: '35733e7', type: 'sell', symbol: 'AAVE', units: 0.426, price: 175.85, status: 'open', date: '2026-02-13', note: 'Profit target established' },
    ]
};

// ═══════════════════════════════════════════════════
// ALTS ACCOUNT — Alto #82263 ("Diversified Alts")
// ═══════════════════════════════════════════════════
export const ALTS_ACCOUNT_DATA: AccountData = {
    accountId: 'alts',
    accountName: 'Alts Account',
    accountNumber: '#82263',
    totalValue: 14059.00, // Updated to match user "Portfolio vibe here: ~$14,059"
    cashBalance: 4505.33, // 32% cash
    availableCash: 10.94,
    totalGainLoss: -658.00, // Approx adjustment

    assets: [
        {
            symbol: "ONDO", name: "Ondo Finance",
            units: 7953, avgCost: 0.27, currentPrice: 0.265, // Mid $0.26-0.27
            currentValue: 2107.54, totalCost: 2147.31, gainLoss: -39.77,
            allocation: 15.00, targetAllocation: 16.00,
            logo: LOGO_MAPPING['ONDO']
        },
        {
            symbol: "RENDER", name: "Render Network",
            units: 1537, avgCost: 1.86, currentPrice: 1.39, // Mid $1.37-1.41
            currentValue: 2136.43, totalCost: 2858.82, gainLoss: -722.39,
            allocation: 15.20, targetAllocation: 16.00,
            logo: LOGO_MAPPING['RENDER']
        },
        {
            symbol: "FET", name: "Fetch.ai",
            units: 12377, avgCost: 0.17, currentPrice: 0.167, // Mid $0.166-0.168
            currentValue: 2066.96, totalCost: 2104.09, gainLoss: -37.13,
            allocation: 14.70, targetAllocation: 16.00,
            logo: LOGO_MAPPING['FET']
        },
        {
            symbol: "UNI", name: "Uniswap",
            units: 588, avgCost: 3.46, currentPrice: 3.405, // Mid $3.40-3.41
            currentValue: 2002.14, totalCost: 2034.48, gainLoss: -32.34,
            allocation: 14.24, targetAllocation: 16.00,
            logo: LOGO_MAPPING['UNI']
        },
        {
            symbol: "HYPE", name: "Hyperliquid",
            units: 35.666, avgCost: 31.60, currentPrice: 31.50, // Mid $31-32
            currentValue: 1123.48, totalCost: 1127.05, gainLoss: -3.57,
            allocation: 8.00, targetAllocation: 16.00,
            logo: LOGO_MAPPING['HYPE']
        },
        {
            symbol: "USD", name: "Cash Reserve (USDC)",
            units: 4505.33, avgCost: 1, currentPrice: 1,
            currentValue: 4505.33, totalCost: 4505.33, gainLoss: 0,
            allocation: 32.05, targetAllocation: 25.00, // Adjusted target to reflect "25% safety net" doctrine more closely
            logo: LOGO_MAPPING['USD']
        }
    ],

    recycledToSui: 0,
    marketTrends: {
        ONDO: [0.24, 0.25, 0.25, 0.26, 0.26, 0.265, 0.265],
        RENDER: [1.30, 1.32, 1.35, 1.37, 1.38, 1.39, 1.39],
        FET: [0.16, 0.16, 0.165, 0.166, 0.167, 0.167, 0.167],
        UNI: [3.25, 3.30, 3.32, 3.35, 3.38, 3.40, 3.405],
        HYPE: [30.0, 30.5, 31.0, 31.2, 31.5, 31.5, 31.5]
    },
    pendingOrders: [
        // ─── Limit Buys (Feb 13 Snapshot) ───
        { id: 'hype-dip-1', type: 'buy', symbol: 'HYPE', units: 12.712, price: 23.59, status: 'open', date: '2026-02-13', note: 'Deep dip buy' },
        { id: 'hype-dip-2', type: 'buy', symbol: 'HYPE', units: 12.963, price: 27.00, status: 'open', date: '2026-02-13', note: 'Closer dip buy' },

        { id: 'uni-dip-1', type: 'buy', symbol: 'UNI', units: 143.37, price: 2.79, status: 'open', date: '2026-02-13', note: 'Deep dip entry' },
        { id: 'uni-dip-2', type: 'buy', symbol: 'UNI', units: 128.20, price: 3.12, status: 'open', date: '2026-02-13', note: 'Closer dip entry' },

        { id: 'ondo-dip-1', type: 'buy', symbol: 'ONDO', units: 2642.01, price: 0.189, status: 'open', date: '2026-02-13', note: 'Deep dip buy' },
        { id: 'ondo-dip-2', type: 'buy', symbol: 'ONDO', units: 2177.89, price: 0.229, status: 'open', date: '2026-02-13', note: 'Closer dip buy' },

        { id: 'render-dip-1', type: 'buy', symbol: 'RENDER', units: 472.59, price: 1.058, status: 'open', date: '2026-02-13', note: 'Deep dip buy' },
        { id: 'render-dip-2', type: 'buy', symbol: 'RENDER', units: 416.32, price: 1.201, status: 'open', date: '2026-02-13', note: 'Closer dip buy' },

        { id: 'fet-dip-1', type: 'buy', symbol: 'FET', units: 3311.30, price: 0.151, status: 'open', date: '2026-02-13', note: 'Dip buy' },
        { id: 'fet-dip-2', type: 'buy', symbol: 'FET', units: 3367.00, price: 0.1485, status: 'open', date: '2026-02-13', note: 'Deeper dip buy' },

        // ─── Limit Sells (Feb 13 Snapshot) ───
        { id: 'render-profit', type: 'sell', symbol: 'RENDER', units: 1537, price: 1.99, status: 'open', date: '2026-02-13', note: 'Profit target ~42%' },
        { id: 'hype-profit', type: 'sell', symbol: 'HYPE', units: 21.41, price: 47.17, status: 'open', date: '2026-02-13', note: 'Profit target ~49%' },
        { id: 'uni-profit', type: 'sell', symbol: 'UNI', units: 194.96, price: 5.181, status: 'open', date: '2026-02-13', note: 'Profit target ~52%' },
        { id: 'ondo-profit', type: 'sell', symbol: 'ONDO', units: 2537.49, price: 0.398, status: 'open', date: '2026-02-13', note: 'Profit target ~47%' },
        { id: 'fet-profit', type: 'sell', symbol: 'FET', units: 3976.10, price: 0.2515, status: 'open', date: '2026-02-13', note: 'Profit target ~50%' }
    ]
};

// ─── Account Registry ───
export const ACCOUNTS: Record<AccountId, AccountData> = {
    sui: SUI_ACCOUNT_DATA,
    alts: ALTS_ACCOUNT_DATA,
};

// Back-compat: default export for existing code
export const PORTFOLIO_DATA = SUI_ACCOUNT_DATA;
