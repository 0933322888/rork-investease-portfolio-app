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
- **External Services**: Plaid integration for financial account linking

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
│   └── lib/              # Backend utilities (Plaid client)
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
The app uses Plaid for financial account linking. Required secrets:
- `PLAID_CLIENT_ID` - Plaid API client ID
- `PLAID_SECRET` - Plaid API secret

## API Endpoints
- `GET /api/health` - Health check
- `/api/trpc/*` - tRPC endpoints (Plaid integration)

## Key Features
- Portfolio tracking for multiple asset types
- Real-time balance updates
- Risk fingerprint assessment
- Plaid integration for bank/investment account linking
- Onboarding flow
- Tab-based navigation (Home, Portfolio, Insights, Settings)

## Recent Changes
- Configured for Replit deployment
- Using static export for web instead of dev server (file watcher limitations)
- Combined backend API with static file serving on port 5000
