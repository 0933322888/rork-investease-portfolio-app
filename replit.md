# InvestEase Portfolio App

## Overview
A cross-platform React Native investment portfolio tracking app built with Expo. It allows users to track stocks, crypto, real estate, and other investments in one place.

## Project Architecture

### Frontend
- **Framework**: Expo Router + React Native
- **UI Components**: React Native Web for web compatibility
- **State Management**: TanStack React Query + Zustand
- **Icons**: Lucide React Native

### Backend
- **API Framework**: Hono (lightweight web framework)
- **RPC**: tRPC for type-safe API calls
- **External Services**: Plaid, SnapTrade, Coinbase, and FMP (Financial Modeling Prep) integrations
- **Market Data**: FMP API via `/stable/` endpoints for real-time quotes, historical prices, and company profiles

### Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Package Manager**: Bun

## Project Structure
```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens (home, portfolio, insights, settings)
│   ├── _layout.tsx        # Root layout with providers
│   ├── onboarding.tsx     # Onboarding screen
│   ├── add-asset.tsx      # Add new asset modal
│   ├── risk-fingerprint.tsx # Risk assessment modal
│   └── connect-plaid.tsx  # Plaid connection modal
├── backend/               # Server-side code
│   ├── hono.ts           # Hono app setup
│   ├── trpc/             # tRPC router configuration
│   └── lib/              # Backend utilities (Plaid, SnapTrade, Coinbase clients)
├── lib/                   # Shared libraries
│   └── trpc.ts           # tRPC client setup
├── contexts/             # React contexts
├── constants/            # App constants (colors, typography, spacing)
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── assets/               # Static assets (images, icons)
├── server.ts             # Production server (Hono + static files)
├── start.sh              # Startup script
└── dist/                 # Built web app (generated)
```

## Running the App

### Development
The app builds and serves automatically. The workflow:
1. Builds the Expo web app to `dist/`
2. Serves it via Hono on port 5000
3. API endpoints available at `/api/trpc/*`

### Scripts
- `bun run dev` - Start the full app (build + server)
- `bun run start-web` - Start Expo dev server (for local development)
- `bun run server` - Run just the server (requires pre-built dist/)

### Environment Variables
The app uses Plaid and SnapTrade for financial account linking. Required secrets:
- `PLAID_CLIENT_ID` - Plaid API client ID
- `PLAID_SECRET` - Plaid API secret
- `SNAPTRADE_CLIENT_ID` - SnapTrade API client ID
- `SNAPTRADE_CONSUMER_KEY` - SnapTrade API consumer key
- `FMP_API_KEY` - Financial Modeling Prep API key (for market prices, historical data, profiles)

## API Endpoints
- `GET /api/health` - Health check
- `/api/trpc/*` - tRPC endpoints (Plaid, SnapTrade, Coinbase, and Market Data)
  - `marketData.getQuote` - Single symbol real-time quote
  - `marketData.getQuotes` - Multiple symbol quotes (fetched in parallel)
  - `marketData.getHistoricalPrices` - Historical prices with range filter (1M/3M/6M/1Y/5Y)
  - `marketData.getProfile` - Company profile (sector, country, industry, marketCap)
  - `marketData.getProfiles` - Multiple company profiles
  - `marketData.getMarketData` - Unified facade with auto symbol mapping (crypto/commodity)

## Key Features
- Portfolio tracking for multiple asset types
- Real-time balance updates
- Risk fingerprint assessment
- Plaid integration for bank account linking
- SnapTrade integration for brokerage connections (Alpaca, Webull, Trading 212, etc.)
- Onboarding flow
- 5-tab navigation (Home, Portfolio, + Add, Insights, Settings) with centered floating Add button

## Recent Changes
- **Market Data Service (Feb 2026)**:
  - Added FMP (Financial Modeling Prep) integration using `/stable/` API endpoints
  - Real-time quotes for stocks, crypto (auto-maps BTC→BTCUSD)
  - Historical price data with range filtering (1M/3M/6M/1Y/5Y)
  - Company profiles with sector, country, industry, marketCap
  - 5-minute in-memory cache for quotes, 30-day cache for profiles
  - Unified facade service with symbol normalization
  - tRPC routes for all market data endpoints
  - Note: Commodity quotes (XAUUSD/XAGUSD) require FMP premium plan
  - Note: Batch quotes fetched individually (free tier limitation)
- **Dark Mode Redesign (Feb 2026)**:
  - Switched entire app to dark-first color scheme (#0D0D14 background, #1A1A2E cards)
  - Updated all screens (home, portfolio, insights, settings, modals) for dark mode
  - Fixed all Colors.card text references to #FFFFFF for proper contrast
  - Updated onboarding gradients to dark-themed palettes
- **5-Tab Navigation (Feb 2026)**:
  - Added centered floating + Add Asset button in tab bar
  - 5 tabs: Home, Portfolio, + (floating), Insights, Settings
  - Tab bar uses #111122 background with subtle border
- **Home Page Premium Redesign (Feb 2026)**:
  - Greeting header with time-based salutation, full date, and tappable avatar
  - Glass/gradient Net Worth card with blue glow effect, percentage pill, tappable to portfolio
  - "7D" label on sparkline chart
  - Allocation donut chart with tappable category rows linking to portfolio
  - Portfolio Health score with progress gauge bar
  - Connected Accounts horizontal scroll with per-type cards and "Add account" button
  - Insights section with icon-prefixed actionable items
- **UI Design Improvements (Feb 2026)**:
  - Added portfolio summary card at top of Portfolio page showing total value, gain/loss with percentage pill, and asset count
  - Added asset type icons (stocks, crypto, real estate, etc.) for visual recognition
  - Added mini sparkline charts (7-day trend) next to each asset in green/red
  - Improved asset items with edit/delete functionality via tap menu
- Premium gating for Connected Accounts section (Settings) and Insights page
- Added SnapTrade integration for brokerage account connections
- **Coinbase Integration (Feb 2026)**:
  - Added read-only Coinbase API integration via API key/secret
  - Backend HMAC-SHA256 request signing for Coinbase Advanced Trade API
  - Connect Coinbase screen with step-by-step instructions
  - Auto-import crypto balances from Coinbase accounts
  - "Connect Coinbase" card in Add Asset > Crypto flow with divider for manual entry
  - Deduplication logic to prevent duplicate assets on reconnect
  - Stored credentials in AsyncStorage (consistent with existing Plaid/SnapTrade pattern)
- Configured for Replit deployment
- Using static export for web instead of dev server (file watcher limitations)
- Combined backend API with static file serving on port 5000

## Design Notes
- **Theme**: Dark mode first (bg #0B1220, card #111A2E, cardSoft #16233B)
- **Color Scheme**: Purple-blue accent (#6C8CFF), green for gains (#32D583), red for losses (#FF6B6B)
- **Asset Colors**: Stocks #6C8CFF, Crypto #F5B14C, Cash #58D68D, Real Estate #FF7A7A, Other #B8C1EC
- **Text Colors**: White primary (#FFFFFF), blue-tinted secondary (#9FB0D0)
- **Premium Badge**: Sparkles icon with pill shape
- **Locked Items**: Use opacity 0.7 and lock icons to indicate premium-only features
- **Charts**: SVG-based sparkline with gradient fill
- **Cards**: 24px border radius, shadow (shadowRadius: 20, shadowOpacity: 0.3)
- **Chips**: borderRadius 20, cardSoft background, 6/12 padding
- **CTA Button**: Green #3FAF7F, height 48, borderRadius 24
- **Connected Account Cards**: 180px wide, borderRadius 20, cardSoft background
- **Tab Bar**: Card background with rounded top corners (24px), 64px floating + button with accent glow
- **Animations**: Reanimated fade+slide-up on native, plain View fallback on web
