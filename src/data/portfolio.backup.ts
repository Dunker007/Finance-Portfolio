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
    journal?: JournalEntry[]; // Optional genesis journal
}

export interface JournalEntry {
    id: string;
    timestamp: string;
    symbol: string;
    type: 'buy' | 'sell' | 'note';
    price?: number;
    units?: number;
    notes: string;
}

// ─── Logo Mappings ───
export const LOGO_MAPPING: Record<string, string> = {
    // SUI Account
    'SUI': 'https://cryptologos.cc/logos/sui-sui-logo.svg',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
    'AAVE': 'https://cryptologos.cc/logos/aave-aave-logo.svg',
    'IMX': 'https://cryptologos.cc/logos/immutable-x-imx-logo.svg',
    'USD': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.svg', // Updated to USDC

    // Alts Account
    'ONDO': 'https://s2.coinmarketcap.com/static/img/coins/64x64/21159.png',
    'RENDER': 'https://s2.coinmarketcap.com/static/img/coins/64x64/5690.png',
    'FET': 'https://s2.coinmarketcap.com/static/img/coins/64x64/3773.png',
    'UNI': 'https://s2.coinmarketcap.com/static/img/coins/64x64/7083.png',
    'HYPE': 'https://s2.coinmarketcap.com/static/img/coins/64x64/34032.png',

    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg'
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
        { id: '513b7d5', type: 'sell', symbol: 'SUI', units: 1100.00, price: 1.05, status: 'open', date: '2026-02-13', note: 'King Rule: Trim Strength' },
        { id: '35733e7', type: 'sell', symbol: 'AAVE', units: 0.426, price: 175.85, status: 'open', date: '2026-02-13', note: 'Profit target' },
        { id: '0105e65', type: 'sell', symbol: 'IMX', units: 282.17, price: 0.2658, status: 'open', date: '2026-02-13', note: 'Ladder sell 1' },
        { id: '12092d7', type: 'sell', symbol: 'IMX', units: 282.17, price: 0.2658, status: 'open', date: '2026-02-13', note: 'Ladder sell 2' },
        { id: '41dad42', type: 'buy', symbol: 'LINK', units: 6.06, price: 7.923, status: 'open', date: '2026-02-13', note: 'Dip entry' },
        { id: 'c5f78c5', type: 'buy', symbol: 'IMX', units: 501.00, price: 0.1497, status: 'open', date: '2026-02-13', note: 'Dip entry' },
        { id: '884824d', type: 'buy', symbol: 'BTC', units: 0.70422535, price: 106.50, status: 'open', date: '2026-02-13', note: 'Speculative position (Price mismatch noted)' },
    ],
    journal: [
        { id: 'init-0', timestamp: '2026-02-13T08:00:00Z', type: 'note', symbol: 'USD', notes: 'Journal Initialized. Starting Cash ~$0. Transactions below generated approx $200 net cash.' },
        // Sells (Raising Cash)
        { id: 'd0578f8', timestamp: '2026-02-13T09:00:00Z', symbol: 'FLR', type: 'sell', units: 24842.00, price: 0.00953, notes: 'Market Sell - Liquidation' },
        { id: '7c6747a', timestamp: '2026-02-13T09:05:00Z', symbol: 'INJ', type: 'sell', units: 74.22, price: 3.123, notes: 'Market Sell - Liquidation' },
        { id: '4e83f83', timestamp: '2026-02-13T09:10:00Z', symbol: 'FLR', type: 'sell', units: 15902.00, price: 0.00953, notes: 'Market Sell - Liquidation' },
        { id: '2c50869', timestamp: '2026-02-13T09:15:00Z', symbol: 'INJ', type: 'sell', units: 11.80, price: 3.121, notes: 'Market Sell - Liquidation' },
        // Buys (Deploying into Strategy)
        { id: '6ef848e', timestamp: '2026-02-13T10:00:00Z', symbol: 'AAVE', type: 'buy', units: 1.241, price: 119.40, notes: 'Market Buy - Strategic Entry' },
        { id: '522de0b', timestamp: '2026-02-13T10:05:00Z', symbol: 'IMX', type: 'buy', units: 877.38, price: 0.169, notes: 'Market Buy - Strategic Entry' },
        { id: '4152523', timestamp: '2026-02-13T10:10:00Z', symbol: 'LINK', type: 'buy', units: 16.82, price: 8.815, notes: 'Market Buy - Strategic Entry' },
    ]
};

// ═══════════════════════════════════════════════════
// ALTS ACCOUNT — Alto #82263 ("Diversified Alts")
// ═══════════════════════════════════════════════════
export const ALTS_ACCOUNT_DATA: AccountData = {
    accountId: 'alts',
    accountName: 'Alts Account',
    accountNumber: '#82263',
    totalValue: 13972.86,
    cashBalance: 4505.33,
    availableCash: 10.94,
    totalGainLoss: -658.00, // Approx from previous context, user didn't specify total PnL

    assets: [
        {
            symbol: "ONDO", name: "Ondo Finance",
            units: 7953.54, avgCost: 0.263, currentPrice: 0.2701,
            currentValue: 2148.49, totalCost: 2092.26, gainLoss: 56.23,
            allocation: 15.40, targetAllocation: 16.00,
            logo: LOGO_MAPPING['ONDO']
        },
        {
            symbol: "RENDER", name: "Render Network",
            units: 1537.10, avgCost: 1.25, currentPrice: 1.39,
            currentValue: 2135.03, totalCost: 1929.91, gainLoss: 205.12,
            allocation: 15.30, targetAllocation: 16.00,
            logo: LOGO_MAPPING['RENDER']
        },
        {
            symbol: "FET", name: "Fetch.ai",
            units: 12377.40, avgCost: 0.169, currentPrice: 0.1674,
            currentValue: 2071.98, totalCost: 2092.24, gainLoss: -20.26,
            allocation: 14.80, targetAllocation: 16.00,
            logo: LOGO_MAPPING['FET']
        },
        {
            symbol: "UNI", name: "Uniswap",
            units: 588.696, avgCost: 3.42, currentPrice: 3.39,
            currentValue: 1995.68, totalCost: 2013.33, gainLoss: -17.65,
            allocation: 14.30, targetAllocation: 16.00,
            logo: LOGO_MAPPING['UNI']
        },
        {
            symbol: "HYPE", name: "Hyperliquid",
            units: 35.666, avgCost: 31.29, currentPrice: 31.30,
            currentValue: 1116.35, totalCost: 1115.85, gainLoss: 0.50,
            allocation: 8.00, targetAllocation: 16.00,
            logo: LOGO_MAPPING['HYPE']
        },
        {
            symbol: "USD", name: "Cash Reserve (USDC)",
            units: 4505.33, avgCost: 1, currentPrice: 1,
            currentValue: 4505.33, totalCost: 4505.33, gainLoss: 0,
            allocation: 32.20, targetAllocation: 25.00,
            logo: LOGO_MAPPING['USD']
        }
    ],

    recycledToSui: 0,
    marketTrends: {
        ONDO: [0.24, 0.25, 0.25, 0.26, 0.26, 0.265, 0.27],
        RENDER: [1.30, 1.32, 1.35, 1.37, 1.38, 1.39, 1.39],
        FET: [0.16, 0.16, 0.165, 0.166, 0.167, 0.167, 0.167],
        UNI: [3.25, 3.30, 3.32, 3.35, 3.38, 3.40, 3.39],
        HYPE: [30.0, 30.5, 31.0, 31.2, 31.5, 31.5, 31.3]
    },
    pendingOrders: [
        // ─── Limit Buys (Feb 13 Snapshot) ───
        { id: '084639c', type: 'buy', symbol: 'HYPE', units: 12.712, price: 23.59, status: 'open', date: '2026-02-13', note: 'Dip Buy 1' },
        { id: '3b66781', type: 'buy', symbol: 'HYPE', units: 12.963, price: 27.00, status: 'open', date: '2026-02-13', note: 'Dip Buy 2' },
        { id: 'b069f8e', type: 'buy', symbol: 'UNI', units: 143.37, price: 2.79, status: 'open', date: '2026-02-13', note: 'Dip Buy 1' },
        { id: 'a04b661', type: 'buy', symbol: 'UNI', units: 128.20, price: 3.12, status: 'open', date: '2026-02-13', note: 'Dip Buy 2' },
        { id: '9aa45cb', type: 'buy', symbol: 'ONDO', units: 2642.01, price: 0.18925, status: 'open', date: '2026-02-13', note: 'Dip Buy 1' },
        { id: '029b889', type: 'buy', symbol: 'ONDO', units: 2177.89, price: 0.22958, status: 'open', date: '2026-02-13', note: 'Dip Buy 2' },
        { id: 'a4519ae', type: 'buy', symbol: 'RENDER', units: 472.59, price: 1.058, status: 'open', date: '2026-02-13', note: 'Dip Buy 1' },
        { id: '391bed1', type: 'buy', symbol: 'RENDER', units: 416.32, price: 1.201, status: 'open', date: '2026-02-13', note: 'Dip Buy 2' },
        { id: 'd1ddb2c', type: 'buy', symbol: 'FET', units: 3311.30, price: 0.151, status: 'open', date: '2026-02-13', note: 'Dip Buy 1' },
        { id: '70091f8', type: 'buy', symbol: 'FET', units: 3367.00, price: 0.1485, status: 'open', date: '2026-02-13', note: 'Dip Buy 2' },

        // ─── Limit Sells (Feb 13 Snapshot) ───
        { id: '04025e2', type: 'sell', symbol: 'RENDER', units: 507.59, price: 1.99, status: 'open', date: '2026-02-13', note: 'Profit Target' },
        { id: 'cb628ee', type: 'sell', symbol: 'HYPE', units: 21.409, price: 47.17, status: 'open', date: '2026-02-13', note: 'Profit Target' },
        { id: '5966d4d', type: 'sell', symbol: 'UNI', units: 194.96, price: 5.181, status: 'open', date: '2026-02-13', note: 'Profit Target' },
        { id: '60c3eba', type: 'sell', symbol: 'ONDO', units: 2537.49, price: 0.39807, status: 'open', date: '2026-02-13', note: 'Profit Target' },
        { id: '8dafa30', type: 'sell', symbol: 'FET', units: 3976.10, price: 0.2515, status: 'open', date: '2026-02-13', note: 'Profit Target' },
    ],
    journal: [
        { id: 'init-alts', timestamp: '2026-02-13T07:00:00Z', type: 'note', symbol: 'USD', notes: 'Journal Initialized. Mass Liquidation Event & Redeployment.' },
        // ─── Liquidations (Sells) ───
        { id: '3a2b4ff', timestamp: '2026-02-13T08:00:00Z', symbol: 'ETH', type: 'sell', units: 1.3288, price: 2057.93, notes: 'Liquidation - $2,734' },
        { id: '56d89ed', timestamp: '2026-02-13T08:01:00Z', symbol: 'BTC', type: 'sell', units: 0.0185, price: 68972.39, notes: 'Liquidation - $1,276' },
        { id: 'f477068', timestamp: '2026-02-13T08:02:00Z', symbol: 'XRP', type: 'sell', units: 681.38, price: 1.413, notes: 'Liquidation - $962' },
        { id: '58bacd7', timestamp: '2026-02-13T08:03:00Z', symbol: 'ADA', type: 'sell', units: 3062.26, price: 0.2726, notes: 'Liquidation - $834' },
        { id: '3c79d40', timestamp: '2026-02-13T08:04:00Z', symbol: 'SOL', type: 'sell', units: 8.548, price: 84.71, notes: 'Liquidation - $724' },
        { id: '924cc14', timestamp: '2026-02-13T08:05:00Z', symbol: 'SUI', type: 'sell', units: 656.70, price: 0.9743, notes: 'Liquidation - $639' },
        { id: '62feab7', timestamp: '2026-02-13T08:06:00Z', symbol: 'LINK', type: 'sell', units: 49.67, price: 8.81, notes: 'Liquidation - $437' },
        { id: '9ca1ae3', timestamp: '2026-02-13T08:07:00Z', symbol: 'AAVE', type: 'sell', units: 3.53, price: 119.42, notes: 'Liquidation - $421' },
        { id: 'd0d233b', timestamp: '2026-02-13T08:08:00Z', symbol: 'CRV', type: 'sell', units: 1624.71, price: 0.2529, notes: 'Liquidation - $410' },
        { id: 'da339e5', timestamp: '2026-02-13T08:09:00Z', symbol: 'ALGO', type: 'sell', units: 4226.80, price: 0.0943, notes: 'Liquidation - $398' },
        { id: '77fa35a', timestamp: '2026-02-13T08:10:00Z', symbol: 'DOGE', type: 'sell', units: 3494.80, price: 0.0964, notes: 'Liquidation - $337' },
        { id: '40aa3fa', timestamp: '2026-02-13T08:11:00Z', symbol: 'NEAR', type: 'sell', units: 279.23, price: 1.022, notes: 'Liquidation - $285' },
        { id: '04c128f', timestamp: '2026-02-13T08:12:00Z', symbol: 'XTZ', type: 'sell', units: 767.51, price: 0.4058, notes: 'Liquidation - $311' },
        { id: '4b6a058', timestamp: '2026-02-13T08:13:00Z', symbol: 'AVAX', type: 'sell', units: 24.36, price: 9.18, notes: 'Liquidation - $223' },
        { id: 'df4628f', timestamp: '2026-02-13T08:14:00Z', symbol: 'ATOM', type: 'sell', units: 92.70, price: 2.084, notes: 'Liquidation - $193' },
        { id: 'b756187', timestamp: '2026-02-13T08:15:00Z', symbol: 'POL', type: 'sell', units: 1797.60, price: 0.0995, notes: 'Liquidation - $178' },
        { id: '286863b', timestamp: '2026-02-13T08:16:00Z', symbol: 'ICP', type: 'sell', units: 74.11, price: 2.386, notes: 'Liquidation - $176' },
        { id: '3c4481a', timestamp: '2026-02-13T08:17:00Z', symbol: 'MOODENG', type: 'sell', units: 3309.06, price: 0.0529, notes: 'Liquidation - $175' },
        { id: '40281ce', timestamp: '2026-02-13T08:18:00Z', symbol: 'FLOKI', type: 'sell', units: 5577986, price: 0.0000306, notes: 'Liquidation - $170' },
        { id: '13a77c5', timestamp: '2026-02-13T08:19:00Z', symbol: 'BONK', type: 'sell', units: 26809367, price: 0.0000063, notes: 'Liquidation - $168' },
        { id: '4bf827a', timestamp: '2026-02-13T08:20:00Z', symbol: 'SAND', type: 'sell', units: 1897.63, price: 0.0884, notes: 'Liquidation - $167' },
        { id: 'ac6af19', timestamp: '2026-02-13T08:21:00Z', symbol: 'AKT', type: 'sell', units: 490.12, price: 0.323, notes: 'Liquidation - $158' },
        { id: 'c3fe50a', timestamp: '2026-02-13T08:22:00Z', symbol: 'DOT', type: 'sell', units: 114.20, price: 1.32, notes: 'Liquidation - $150' },
        { id: '2a3afa9', timestamp: '2026-02-13T08:23:00Z', symbol: 'AXS', type: 'sell', units: 99.904, price: 1.376, notes: 'Liquidation - $137' },
        { id: '7ee3693', timestamp: '2026-02-13T08:24:00Z', symbol: 'MINA', type: 'sell', units: 1614.50, price: 0.0684, notes: 'Liquidation - $110' },
        { id: 'b375ae3', timestamp: '2026-02-13T08:25:00Z', symbol: 'BLAST', type: 'sell', units: 159094, price: 0.00059, notes: 'Liquidation - $93' },
        { id: '4a09452', timestamp: '2026-02-13T08:26:00Z', symbol: 'ORCA', type: 'sell', units: 110.89, price: 0.7818, notes: 'Liquidation - $86' },
        { id: '808a330', timestamp: '2026-02-13T08:27:00Z', symbol: 'FIL', type: 'sell', units: 157.718, price: 0.949, notes: 'Liquidation - $149' },
        { id: '7f7ed29', timestamp: '2026-02-13T08:28:00Z', symbol: 'WIF', type: 'sell', units: 384.55, price: 0.22, notes: 'Liquidation - $84' },
        { id: 'fc40de2', timestamp: '2026-02-13T08:29:00Z', symbol: 'GIGA', type: 'sell', units: 22078.90, price: 0.00224, notes: 'Liquidation - $49' },
        { id: '3777800', timestamp: '2026-02-13T08:30:00Z', symbol: 'SWELL', type: 'sell', units: 27963.00, price: 0.0013, notes: 'Liquidation - $36' },
        { id: 'bce6535', timestamp: '2026-02-13T08:31:00Z', symbol: 'GODS', type: 'sell', units: 2150.39, price: 0.03819, notes: 'Liquidation - $82' },
        // c60ed82 HBAR Sell? Wait, log has HBAR sell after buys? Check timestamp. 
        // Log says HBAR Executed.
        { id: 'c60ed82', timestamp: '2026-02-13T08:32:00Z', symbol: 'HBAR', type: 'sell', units: 11702.70, price: 0.09689, notes: 'Liquidation - $1,133' },

        // ─── Redeployment (Buys) ───
        { id: 'b9251a4', timestamp: '2026-02-13T12:00:00Z', symbol: 'RENDER', type: 'buy', units: 1416.97, price: 1.362, notes: 'Core Position Entry' },
        { id: '4217c94', timestamp: '2026-02-13T12:05:00Z', symbol: 'FET', type: 'buy', units: 12597.40, price: 0.1661, notes: 'Core Position Entry' },
        { id: '66c0699', timestamp: '2026-02-13T12:10:00Z', symbol: 'UNI', type: 'buy', units: 385.07, price: 3.421, notes: 'Core Position Entry' },
        { id: '91b02e0', timestamp: '2026-02-13T12:15:00Z', symbol: 'HYPE', type: 'buy', units: 35.666, price: 31.29, notes: 'Core Position Entry' },
        { id: '14fe634', timestamp: '2026-02-13T12:20:00Z', symbol: 'UNI', type: 'buy', units: 384.95, price: 3.422, notes: 'Entry 2' },
        { id: '87d0647', timestamp: '2026-02-13T12:25:00Z', symbol: 'ONDO', type: 'buy', units: 7953.54, price: 0.26306, notes: 'Core Position Entry' },
        { id: 'af08e15', timestamp: '2026-02-13T12:30:00Z', symbol: 'HBAR', type: 'buy', units: 6718.10, price: 0.09593, notes: 'Entry' },
        { id: 'd369a00', timestamp: '2026-02-13T13:00:00Z', symbol: 'UNI', type: 'sell', units: 227.65, price: 3.417, notes: 'Trim' },
        { id: '6c5b197', timestamp: '2026-02-13T13:05:00Z', symbol: 'FET', type: 'buy', units: 381.70, price: 0.1661, notes: 'Add' },
        { id: 'fdd7b54', timestamp: '2026-02-13T13:10:00Z', symbol: 'UNI', type: 'sell', units: 43.64, price: 3.435, notes: 'Trim' },
        { id: 'd799e30', timestamp: '2026-02-13T13:15:00Z', symbol: 'UNI', type: 'sell', units: 43.64, price: 3.435, notes: 'Trim' },
        { id: 'a78e12e', timestamp: '2026-02-13T13:20:00Z', symbol: 'FET', type: 'sell', units: 601.70, price: 0.1661, notes: 'Trim' },
        { id: '14f95a3', timestamp: '2026-02-13T13:25:00Z', symbol: 'UNI', type: 'buy', units: 18.72, price: 3.431, notes: 'Add' },
        { id: 'ddb364d', timestamp: '2026-02-13T13:30:00Z', symbol: 'UNI', type: 'buy', units: 10.08, price: 3.43, notes: 'Add' },
    ]
};

// ─── Account Registry ───
export const ACCOUNTS: Record<AccountId, AccountData> = {
    sui: SUI_ACCOUNT_DATA,
    alts: ALTS_ACCOUNT_DATA,
};

// Back-compat: default export for existing code
export const PORTFOLIO_DATA = SUI_ACCOUNT_DATA;
