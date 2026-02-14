export interface Asset {
    symbol: string;
    name: string;
    units: number;
    avgCost: number | null;
    currentPrice: number;
    currentValue: number;
    totalCost: number | null;
    gainLoss: number | null;
    allocation: number; // Current %
    targetAllocation: number; // Goal %
    logo?: string;
}

export const LOGO_MAPPING: Record<string, string> = {
    'SUI': 'https://cryptologos.cc/logos/sui-sui-logo.svg',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.svg',
    'AAVE': 'https://cryptologos.cc/logos/aave-aave-logo.svg',
    'IMX': 'https://cryptologos.cc/logos/immutable-x-imx-logo.svg',
    'USD': 'https://cryptologos.cc/logos/tether-usdt-logo.svg', // Using USDT as a proxy for USD logo
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg'
};

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

export const PORTFOLIO_DATA = {
    accountName: "Roth Alto CryptoIRA (#82367)",
    totalValue: 3589.45, // Updated for the green day
    cashBalance: 201.20,
    availableCash: 1.21,
    totalGainLoss: -810.22, // Recovering...

    assets: [
        {
            symbol: "SUI",
            name: "Sui",
            units: 3012.10,
            avgCost: 1.24,
            currentPrice: 0.9825,
            currentValue: 2959.38,
            totalCost: 3735.00,
            gainLoss: -775.62,
            allocation: 82.45,
            targetAllocation: 50.00,
            logo: LOGO_MAPPING['SUI']
        },
        {
            symbol: "LINK",
            name: "Chainlink",
            units: 16.82,
            avgCost: 8.90,
            currentPrice: 8.88,
            currentValue: 149.36,
            totalCost: 149.75,
            gainLoss: -0.39,
            allocation: 4.16,
            targetAllocation: 8.33,
            logo: LOGO_MAPPING['LINK']
        },
        {
            symbol: "AAVE",
            name: "Aave",
            units: 1.241,
            avgCost: 120.60,
            currentPrice: 121.05,
            currentValue: 150.22,
            totalCost: 149.66,
            gainLoss: 0.56,
            allocation: 4.18,
            targetAllocation: 8.33,
            logo: LOGO_MAPPING['AAVE']
        },
        {
            symbol: "IMX",
            name: "ImmutableX",
            units: 877.38,
            avgCost: 0.17,
            currentPrice: 0.1685,
            currentValue: 147.84,
            totalCost: 149.76,
            gainLoss: -1.92,
            allocation: 4.12,
            targetAllocation: 8.34,
            logo: LOGO_MAPPING['IMX']
        },
        {
            symbol: "USD",
            name: "Cash Reserve (USDC)",
            units: 201.20,
            avgCost: 1,
            currentPrice: 1,
            currentValue: 201.20,
            totalCost: 201.20,
            gainLoss: 0,
            allocation: 5.60,
            targetAllocation: 25.00,
            logo: LOGO_MAPPING['USD']
        }
    ] as Asset[],

    recycledToSui: 450.00, // Total USD profit recycled from Alts into SUI
    marketTrends: {
        SUI: [0.88, 0.90, 0.92, 0.91, 0.95, 0.98, 0.97],
        LINK: [8.20, 8.40, 8.35, 8.60, 8.75, 8.88, 8.95],
        AAVE: [110, 112, 115, 118, 122, 120, 121]
    },
    pendingOrders: [
        { id: '41dad42', type: 'buy', symbol: 'LINK', units: 6.06, price: 7.923, status: 'open', date: '2026-02-13', note: 'Dip entry for LINK' },
        { id: 'c5f78c5', type: 'buy', symbol: 'IMX', units: 501.00, price: 0.1497, status: 'open', date: '2026-02-13', note: 'IMX lagging, watch for dip' },
        { id: '35733e7', type: 'sell', symbol: 'AAVE', units: 0.426, price: 175.85, status: 'open', date: '2026-02-13', note: 'Profit target established' },
        { id: 'sui-ladder-1', type: 'sell', symbol: 'SUI', units: 500.00, price: 1.02, status: 'open', date: '2026-02-13', note: 'Ladder 1: Capture strength' },
        { id: 'sui-ladder-2', type: 'sell', symbol: 'SUI', units: 600.00, price: 1.05, status: 'open', date: '2026-02-13', note: 'Ladder 2: Core rebalance target' }
    ] as Order[]
};
