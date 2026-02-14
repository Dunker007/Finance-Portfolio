# Smart Folio - AI Powered Crypto Tracker

This is a modern, AI-enhanced crypto dashboard designed for grid trading analysis and position management.

## Features
- **Grid Visualizer**: Displays your active PEPEUSDT grid strategy with real-time levels.
- **AI Analyst**: An interactive chat interface (simulated) that provides insights on your positions.
- **Detailed Metrics**: Comprehensive breakdown of PnL, fees, and margin.
- **Dark Mode UI**: Premium trading terminal aesthetic.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure
- `src/app`: Next.js App Router pages and layout.
- `src/components`: UI components (GridVisualizer, AIAnalyst, etc.).
- `src/data`: Static data files (currently holding your PEPE grid data).

## Future Roadmap
- Connect to Exchange APIs (Binance, Bybit) for real-time updates.
- Integrate real LLM backend (OpenAI/Anthropic) for dynamic analysis.
- Add portfolio tracking across multiple exchanges.
