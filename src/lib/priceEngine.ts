/**
 * SmartFolio — Live Price Engine
 * ================================
 * Polls Coinbase public API for real-time spot prices.
 * No API key required — uses the free /v2/prices endpoint.
 * 
 * Architecture:
 *   - fetchPrices(): One-shot fetch for all symbols
 *   - startPolling(): Continuous polling at configurable interval
 *   - Callbacks: onPriceUpdate fires with { symbol, price } map
 */

// ─── Types ───
export interface PriceMap {
    [symbol: string]: number;
}

export interface PriceEngineConfig {
    symbols: string[];
    intervalMs: number;          // Default 30s
    onPriceUpdate: (prices: PriceMap) => void;
    onError?: (error: Error) => void;
    onSyncComplete?: (timestamp: Date) => void;
}

// ─── Coinbase Price Fetch ───
async function fetchCoinbasePrice(symbol: string): Promise<number | null> {
    try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data?.amount ? parseFloat(data.data.amount) : null;
    } catch {
        return null;
    }
}

// ─── Batch Fetch (Sequential to avoid rate limits) ───
export async function fetchPrices(symbols: string[]): Promise<PriceMap> {
    const prices: PriceMap = {};
    const tradableSymbols = symbols.filter(s => s !== 'USD');

    // Fetch in parallel batches of 5 to stay within rate limits
    const batchSize = 5;
    for (let i = 0; i < tradableSymbols.length; i += batchSize) {
        const batch = tradableSymbols.slice(i, i + batchSize);
        const results = await Promise.allSettled(
            batch.map(async (symbol) => {
                const price = await fetchCoinbasePrice(symbol);
                if (price !== null) {
                    prices[symbol] = price;
                }
            })
        );
    }

    return prices;
}

// ─── Polling Engine ───
let _pollInterval: ReturnType<typeof setInterval> | null = null;
let _isPolling = false;

export function startPolling(config: PriceEngineConfig): () => void {
    stopPolling(); // Clean up any existing

    const { symbols, intervalMs, onPriceUpdate, onError, onSyncComplete } = config;

    const poll = async () => {
        if (_isPolling) return; // Skip if previous poll still running
        _isPolling = true;
        try {
            const prices = await fetchPrices(symbols);
            if (Object.keys(prices).length > 0) {
                onPriceUpdate(prices);
                onSyncComplete?.(new Date());
            }
        } catch (err) {
            onError?.(err instanceof Error ? err : new Error(String(err)));
        } finally {
            _isPolling = false;
        }
    };

    // Immediate first fetch
    poll();

    // Then poll on interval
    _pollInterval = setInterval(poll, intervalMs);

    // Return cleanup function
    return stopPolling;
}

export function stopPolling(): void {
    if (_pollInterval) {
        clearInterval(_pollInterval);
        _pollInterval = null;
    }
    _isPolling = false;
}

export function isPolling(): boolean {
    return _pollInterval !== null;
}
