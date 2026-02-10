# FriendBets - Prediction Market for Friends

A private prediction market website (like Polymarket) built for friend groups. Uses fake currency, parimutuel betting pools, and wallet-key authentication. No database - just JSON file storage.

## How It Works
- Every user starts with **1000 coins** (fake currency)
- An admin creates **markets** (yes/no questions like "Will the Lakers win tonight?")
- Users **bet coins** into a shared pool on different outcomes
- When the market resolves, the **total pool is split proportionally among winners**
- Example: 500 coin pool (300 on Yes, 200 on No). Yes wins. A user who bet 100 on Yes gets `(100/300) * 500 = 166.67` coins back
- No house cut - keeps it friendly

## Tech Stack
- **Next.js 14** (App Router, API routes)
- **Tailwind CSS v3** (dark theme)
- **JSON files** for data storage (`data/` directory)
- **Wallet-key auth** (unique hex key per user, stored in cookie + localStorage)

## Features
- Wallet-key login (admin generates keys for users)
- Admin dashboard (create users, create markets, resolve markets)
- Live odds display with pool visualization
- Public bet feed on each market
- Leaderboard ranked by balance
- Dark theme, responsive design

## Project Structure
```
chopplifedPolyfund/
├── data/                    # JSON storage (users, markets, bets)
├── lib/
│   ├── storage.ts           # JSON file read/write with locking
│   ├── auth.ts              # Wallet-key auth utilities
│   └── parimutuel.ts        # Pool math and payout logic
├── app/
│   ├── layout.tsx           # Root layout with nav
│   ├── page.tsx             # Dashboard (open markets + balance)
│   ├── login/page.tsx       # Wallet key login
│   ├── admin/page.tsx       # Admin dashboard
│   ├── market/[id]/page.tsx # Market detail + betting UI
│   ├── leaderboard/page.tsx # Ranked by balance
│   └── api/                 # API routes
├── middleware.ts             # Auth redirect
├── plans/                   # Implementation docs per phase
└── README.md
```

## Implementation Progress

### Phase 1: Project Setup - DONE
- Next.js 14 + Tailwind v3 initialized
- `lib/storage.ts` - JSON read/write with in-memory locking
- `data/` directory with empty `users.json`, `markets.json`, `bets.json`
- Build verified working

### Phase 2: Auth System - DONE
- `lib/auth.ts` - wallet key generation, validation, getUserFromRequest, requireAdmin
- `app/api/auth/login/route.ts` - accepts wallet key, sets cookie
- `app/api/auth/logout/route.ts` - clears cookie
- `app/api/auth/me/route.ts` - returns current user info
- `app/login/page.tsx` - wallet key login form UI
- `middleware.ts` - redirects unauthenticated users to /login

### Phase 3: Admin & User Management - DONE
- `lib/types.ts` - shared User, Market, Bet types
- `lib/seed.ts` - auto-seeds admin user on first run (prints wallet key to console)
- `app/api/admin/users/route.ts` - GET list users, POST create user (admin only)
- `app/api/admin/markets/route.ts` - GET list markets, POST create market (admin only)
- `app/api/admin/markets/[id]/resolve/route.ts` - POST resolve market (admin only)
- `app/admin/page.tsx` - admin dashboard with user/market management

### Phase 4: Markets Display - DONE
- Home dashboard showing open markets + user balance
- Market detail page with pool visualization
- Markets API routes

### Phase 5: Betting System - DONE
- Place bet API with validation (balance, market open)
- Parimutuel math (odds, implied probability, payout multiplier)
- Betting UI, bet feed, live odds display

### Phase 6: Market Resolution & Payouts - DONE
- Admin resolves market -> triggers payout calculation
- Pool distributed proportionally to winners, balances updated
- Results displayed on resolved market pages with per-bet payout badges

### Phase 7: Leaderboard & Polish - DONE
- Leaderboard page ranked by balance with top-3 highlighting
- Navigation bar with Leaderboard link, responsive design, dark theme polish

## Getting Started
```bash
npm install
npm run dev
```
On first run, an admin wallet key is printed to the console. Use it to log in.
