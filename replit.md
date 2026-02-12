# Assetra Portfolio App

## Overview
A cross-platform React Native investment portfolio tracking app built with Expo. It allows users to track stocks, crypto, real estate, and other investments in one place. Features production-grade authentication with Clerk, biometric app lock, and a premium dark fintech UI.

## Project Architecture

### Frontend
- **Framework**: Expo Router + React Native
- **UI Components**: React Native Web for web compatibility
- **State Management**: TanStack React Query + Zustand
- **Icons**: Lucide React Native
- **Auth**: Clerk (Expo SDK) with SecureStore token cache

### Backend
- **API Framework**: Hono (lightweight web framework)
- **RPC**: tRPC for type-safe API calls
- **Database**: PostgreSQL (Replit built-in) with Drizzle ORM
- **Auth Middleware**: Clerk JWT verification via @clerk/backend
- **External Services**: Plaid, SnapTrade, Coinbase, and FMP integrations
- **Market Data**: FMP API via `/stable/` endpoints for real-time quotes, historical prices, and company profiles

### Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Package Manager**: Bun

## Project Structure
```
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Auth screens (sign-in, sign-up)
│   ├── (tabs)/            # Tab navigation screens (home, portfolio, insights, settings)
│   ├── _layout.tsx        # Root layout with ClerkProvider + auth redirect
│   ├── onboarding.tsx     # Onboarding screen
│   ├── add-asset.tsx      # Add new asset modal
│   └── connect-plaid.tsx  # Plaid connection modal
├── backend/               # Server-side code
│   ├── db/               # Database (Drizzle ORM schema, migration, connection)
│   ├── middleware/        # Clerk JWT auth middleware for Hono
│   ├── hono.ts           # Hono app setup
│   ├── trpc/             # tRPC router configuration
│   └── lib/              # Backend utilities (Plaid, SnapTrade, Coinbase clients)
├── providers/             # App providers
│   └── ClerkProvider.tsx  # Clerk auth provider with SecureStore
├── hooks/                 # Custom hooks
│   └── useAppLock.ts     # Biometric app lock hook (native only)
├── components/            # Shared components
│   └── AppLockOverlay.tsx # Biometric unlock overlay
├── lib/                   # Shared libraries
│   └── trpc.ts           # tRPC client setup (with auth headers)
├── contexts/             # React contexts
├── constants/            # App constants (colors, typography, spacing)
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── assets/               # Static assets (images, icons)
├── server.ts             # Production server (Hono + static files + auth endpoints)
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
Required secrets:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (frontend)
- `CLERK_SECRET_KEY` - Clerk secret key (backend JWT verification)
- `PLAID_CLIENT_ID` - Plaid API client ID
- `PLAID_SECRET` - Plaid API secret
- `SNAPTRADE_CLIENT_ID` - SnapTrade API client ID
- `SNAPTRADE_CONSUMER_KEY` - SnapTrade API consumer key
- `FMP_API_KEY` - Financial Modeling Prep API key

Database (auto-configured by Replit):
- `DATABASE_URL` - PostgreSQL connection string

## Authentication Flow
1. App starts → ClerkProvider wraps the app
2. If no Clerk keys → auth is bypassed, app works normally
3. If Clerk keys present → unauthenticated users redirect to sign-in
4. Sign-in options: Apple, Google, Email magic link
5. After login → user auto-created in PostgreSQL (bootstrap endpoint)
6. Clerk JWT attached to all API requests
7. On native devices: biometric lock after 5 min in background

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/bootstrap` - Create/fetch user profile (protected)
- `/api/trpc/*` - tRPC endpoints
  - `auth.bootstrap` - Create user + portfolio in DB
  - `auth.getProfile` - Get user profile
  - `marketData.getQuote` - Single symbol real-time quote
  - `marketData.getQuotes` - Multiple symbol quotes
  - `marketData.getHistoricalPrices` - Historical prices with range filter
  - `marketData.getProfile` - Company profile
  - `marketData.getProfiles` - Multiple company profiles
  - `marketData.getMarketData` - Unified facade with auto symbol mapping

## Database Schema (PostgreSQL)
### Users table
- id (UUID, primary key)
- clerk_user_id (VARCHAR, unique)
- email, first_name, last_name, avatar_url
- subscription_status (default: "free")
- created_at, updated_at

### Portfolios table
- id (UUID, primary key)
- user_id (UUID, references users)
- base_currency (default: "USD")
- total_value (NUMERIC)
- last_calculated_at, created_at, updated_at

## Key Features
- Portfolio tracking for multiple asset types (stocks, crypto, commodities, fixed-income, real estate, cash, other)
- Real-time balance updates via FMP API
- Risk fingerprint assessment
- Clerk authentication (Apple, Google, email magic link)
- Biometric app lock (FaceID/Fingerprint on native)
- Plaid integration for bank account linking
- SnapTrade integration for brokerage connections
- Coinbase integration for crypto balances
- Premium insights with detailed analytics
- Onboarding flow
- 5-tab navigation (Home, Portfolio, + Add, Insights, Settings)

## Recent Changes
- **Risk Fingerprint Merge (Feb 2026)**:
  - Merged Portfolio Fingerprint page into the Insights tab (PremiumInsights component)
  - Radar chart, interpretation text, badges, and risk dimensions now appear in Insights
  - Removed standalone risk-fingerprint.tsx page
  - Home "Improve my portfolio" button now navigates to Insights tab
  - Real historical price sparklines on portfolio asset items (FMP 1M data, sampled to 12 points)
- **Live Market Prices (Feb 2026)**:
  - Market Prices card on Home tab with horizontally scrollable live tickers
  - Per-unit market price shown on each stock/crypto asset in Portfolio tab
  - Day change percentage pill (green/red) on each tradeable asset
  - Market quotes stored in PortfolioContext (price, changePercent, dayChange per symbol)
  - Profile editing screen (edit name, change avatar, delete account)
  - tRPC endpoints: updateProfile (with auto-create), deleteAccount
  - Settings profile card tappable to navigate to profile editor
- **Premium Subscription Flow (Feb 2026)**:
  - Premium paywall screen (`app/premium.tsx`) with feature list, pricing, and upgrade button
  - tRPC endpoints for reading/updating subscription status from PostgreSQL
  - SubscriptionContext reads real subscription status from DB (no longer hardcoded)
  - Subscription query only fires when user is signed in (auth-gated)
  - Settings hides "Upgrade to Premium" when already premium
  - PRO badge with crown icon shown on profile card for premium users
  - Premium screen handles already-premium state gracefully
- **Authentication System (Feb 2026)**:
  - Added Clerk authentication with Apple, Google, email magic link sign-in
  - ClerkProvider with SecureStore token cache (native) for secure session persistence
  - Auth screens (sign-in, sign-up) with dark fintech UI
  - Route protection with auth redirect in root layout
  - Clerk JWT verification middleware for Hono backend
  - User bootstrap endpoint (REST + tRPC) for auto-creating user/portfolio in DB
  - Secure API client attaching Clerk JWT to all tRPC requests
  - Biometric app lock (FaceID/Fingerprint) after 5 min background, native only
  - PostgreSQL database with Drizzle ORM (users + portfolios tables)
  - Graceful fallback: app works normally without Clerk keys configured
- **Premium Insights Enhancement (Feb 2026)**:
  - Total Return section with 1M, 1Y, All Time returns (% and dollar amounts)
  - Cost basis vs current value breakdown
  - Diversification score badge (Low/Fair/Good/Excellent)
  - Per-type allocation with individual gain/loss
  - Concentration Risk with top 5 holdings
  - Recommendations based on portfolio data
- **Assetra Branding (Feb 2026)**:
  - Renamed from InvestEase to Assetra
  - Custom logo on home page and onboarding
- **Market Data Service (Feb 2026)**:
  - FMP integration for real-time quotes, historical prices, company profiles
- **Coinbase Integration (Feb 2026)**:
  - Read-only Coinbase API integration via API key/secret
- Configured for Replit deployment
- Using static export for web instead of dev server
- Combined backend API with static file serving on port 5000

## Design Notes
- **Theme**: Dark mode first (bg #0B1220, card #111A2E, cardSoft #16233B)
- **Color Scheme**: Purple-blue accent (#6C8CFF), green for gains (#32D583), red for losses (#FF6B6B)
- **Asset Colors**: Stocks #6C8CFF, Crypto #F5B14C, Cash #58D68D, Real Estate #FF7A7A, Other #B8C1EC
- **Text Colors**: White primary (#FFFFFF), blue-tinted secondary (#9FB0D0)
- **Auth Screens**: Centered layout, large OAuth buttons, email input with magic link
- **Premium Badge**: Sparkles icon with pill shape
- **Cards**: 24px border radius, shadow (shadowRadius: 20, shadowOpacity: 0.3)
- **Tab Bar**: Card background with rounded top corners (24px), 64px floating + button
- **Animations**: Reanimated fade+slide-up on native, plain View fallback on web
