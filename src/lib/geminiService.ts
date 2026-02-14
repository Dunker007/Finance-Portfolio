/**
 * SmartFolio — Gemini AI Service
 * ================================
 * Client-side integration with Google Gemini 2.0 Flash.
 * API key sourced from:
 *   1. NEXT_PUBLIC_GEMINI_API_KEY env var (.env.local)
 *   2. localStorage fallback (for Settings page override)
 */
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';

// ─── Key Management ───
const STORAGE_KEY = 'smartfolio_gemini_key';

export function getGeminiKey(): string {
    // Priority: env var → localStorage
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
        (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || '' : '');
}

export function setGeminiKey(key: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, key);
    }
}

export function hasGeminiKey(): boolean {
    return getGeminiKey().length > 0;
}

// ─── Model Singleton ───
let _model: GenerativeModel | null = null;
let _lastKey = '';

function getModel(): GenerativeModel {
    const key = getGeminiKey();
    if (!key) throw new Error('Gemini API key not configured');

    // Re-create if key changed
    if (!_model || key !== _lastKey) {
        const genAI = new GoogleGenerativeAI(key);
        _model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        _lastKey = key;
    }
    return _model;
}

// ─── Portfolio Context Builder ───
export interface PortfolioSnapshot {
    accountName: string;
    strategyName: string;
    targetMask: string;
    marketRegime: string;
    totalValue: number;
    cashPercent: number;
    positions: {
        symbol: string;
        units: number;
        avgCost: number | null;
        currentPrice: number;
        currentValue: number;
        allocation: number;
        targetAllocation: number;
        gainLoss: number | null;
    }[];
    pendingOrders: {
        type: string;
        symbol: string;
        units: number;
        price: number;
        note?: string;
    }[];
    strategyRules: string[];
}

function buildSystemPrompt(snapshot: PortfolioSnapshot, persona: 'anchor' | 'tactician'): string {
    const positions = snapshot.positions
        .map(p => `  ${p.symbol}: ${p.units.toFixed(2)} units @ $${p.currentPrice} (${p.allocation.toFixed(1)}% alloc, target ${p.targetAllocation}%, PnL: $${(p.gainLoss || 0).toFixed(2)})`)
        .join('\n');

    const orders = snapshot.pendingOrders.length > 0
        ? snapshot.pendingOrders.map(o => `  ${o.type.toUpperCase()} ${o.units} ${o.symbol} @ $${o.price}${o.note ? ` — ${o.note}` : ''}`).join('\n')
        : '  None';

    const rules = snapshot.strategyRules.map(r => `  • ${r}`).join('\n');

    return `You are SmartFolio AI — ${persona === 'anchor' ? 'The Anchor' : 'The Tactician'}, a senior crypto portfolio strategist managing a Roth IRA account.

PERSONALITY:
${persona === 'anchor'
            ? '- Disciplined, mathematical, conviction-driven. SUI is your anchor position. You think in terms of accumulation zones, DCA levels, and compounding.'
            : '- Agile, data-driven rotation specialist. No single king — you manage a balanced portfolio of 5 high-conviction alts. You think in terms of relative strength, profit-taking, and capital rotation.'}
- You speak concisely. No fluff. Use numbers. Give actionable recommendations.
- You understand this is a Roth IRA (tax-free gains, no leverage, spot only, 1% trade fee per transaction via Alto/Coinbase).
- When suggesting trades, always factor in the 1% fee and current cash levels.

CURRENT PORTFOLIO STATE:
Account: ${snapshot.accountName}
Strategy: ${snapshot.strategyName} (${snapshot.targetMask})
Market Regime: ${snapshot.marketRegime.toUpperCase()}
Total Value: $${snapshot.totalValue.toFixed(2)}
Cash: ${snapshot.cashPercent.toFixed(1)}%

POSITIONS:
${positions}

PENDING ORDERS:
${orders}

STRATEGY RULES:
${rules}

INSTRUCTIONS:
- Reference actual numbers from the portfolio above.
- If asked about a specific token, focus on its allocation vs target, PnL, and any pending orders.
- When recommending buys, check cash reserves first. If cash < 15%, warn about low liquidity.
- When recommending sells, calculate expected proceeds after 1% fee.
- Keep responses under 150 words unless asked for detailed analysis.
- Format key numbers in bold when relevant.`;
}

// ─── Chat Interface ───
let _chatSession: ChatSession | null = null;
let _chatContext = '';

export async function startChat(snapshot: PortfolioSnapshot, persona: 'anchor' | 'tactician'): Promise<void> {
    const model = getModel();
    const systemPrompt = buildSystemPrompt(snapshot, persona);
    _chatContext = systemPrompt;
    _chatSession = model.startChat({
        history: [{
            role: 'user',
            parts: [{ text: 'Initialize.' }]
        }, {
            role: 'model',
            parts: [{ text: 'Online. Portfolio loaded. Ready for analysis.' }]
        }],
        generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
        },
    });
}

export async function sendMessage(message: string): Promise<string> {
    if (!_chatSession) throw new Error('Chat not initialized. Call startChat() first.');

    try {
        const result = await _chatSession.sendMessage(message);
        return result.response.text();
    } catch (error: any) {
        if (error?.message?.includes('API key')) {
            return '⚠️ Invalid API key. Check Settings → Gemini API Key.';
        }
        console.error('[Gemini]', error);
        return `⚠️ Gemini error: ${error?.message || 'Unknown error'}. Check console.`;
    }
}

// ─── One-shot Analysis ───
export async function analyzePortfolio(snapshot: PortfolioSnapshot, persona: 'anchor' | 'tactician', prompt: string): Promise<string> {
    const model = getModel();
    const systemPrompt = buildSystemPrompt(snapshot, persona);

    try {
        const result = await model.generateContent([
            { text: systemPrompt },
            { text: prompt }
        ]);
        return result.response.text();
    } catch (error: any) {
        console.error('[Gemini]', error);
        return `⚠️ Analysis failed: ${error?.message || 'Unknown error'}`;
    }
}

// ─── Quick Health Check ───
export async function quickHealthCheck(snapshot: PortfolioSnapshot, persona: 'anchor' | 'tactician'): Promise<string> {
    return analyzePortfolio(snapshot, persona,
        'Give me a 3-line portfolio health check. Line 1: Overall status (one word + emoji). Line 2: Biggest risk right now. Line 3: Top action item. Be specific with numbers.'
    );
}

// ─── Validate Key ───
export async function validateKey(key?: string): Promise<boolean> {
    try {
        const testKey = key || getGeminiKey();
        if (!testKey) return false;
        const genAI = new GoogleGenerativeAI(testKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Say OK');
        return result.response.text().length > 0;
    } catch {
        return false;
    }
}
