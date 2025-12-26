# Baby Step 17: UI Dashboard

## 🎯 Goal
Build a modern, responsive web dashboard to visualize stock analysis, portfolios, and trading signals.

## 📋 Features

### Phase 1: Core Layout (Start Here)
- [ ] Modern dashboard layout with navigation
- [ ] Home page with system overview
- [ ] Responsive design (mobile-friendly)
- [ ] Dark/Light theme support

### Phase 2: Portfolio View
- [ ] Portfolio list and selection
- [ ] Position cards with current prices
- [ ] P&L (Profit/Loss) visualization
- [ ] Add/Edit/Delete positions

### Phase 3: Stock Analysis
- [ ] Symbol search and lookup
- [ ] Technical indicators display (SMA, RSI, MACD, etc.)
- [ ] Price charts with indicators
- [ ] Trading signals (BUY/SELL/HOLD)

### Phase 4: Advanced Features
- [ ] Sector strength visualization
- [ ] Deep dive reports viewer
- [ ] Stop-loss alerts and management
- [ ] Daily deltas and change tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts or Chart.js
- **State**: React Query for API calls
- **Icons**: Lucide React

## 🎨 Design Principles

1. **Clean & Modern**: Minimalist design, focus on data
2. **Responsive**: Works on desktop, tablet, mobile
3. **Fast**: Optimized loading, smooth animations
4. **Intuitive**: Easy navigation, clear actions
5. **Professional**: Finance-grade UI with proper colors (green=profit, red=loss)

## 📐 Pages Structure

```
/                           → Home Dashboard
/portfolios                 → Portfolio List
/portfolios/:id             → Portfolio Detail
/stocks/:symbol             → Stock Analysis
/sectors                    → Sector Rankings
/reports                    → Deep Dive Reports
/settings                   → Configuration
```

## 🚀 Getting Started

1. Create Next.js app in `apps/web`
2. Install dependencies (Tailwind, shadcn/ui, Recharts)
3. Connect to worker API (http://localhost:3001)
4. Build page by page

## 📊 Sample Screens

### Home Dashboard
- Quick stats: Total portfolios, active positions, today's P&L
- Recent signals (STRONG_BUY, BUY, SELL, STRONG_SELL)
- Top gainers/losers
- Quick actions (Add position, Run analysis)

### Portfolio Detail
- Header: Portfolio name, total value, P&L %
- Position grid: Symbol, shares, buy price, current price, P&L, actions
- Charts: Portfolio performance over time
- Stop-loss status indicators

### Stock Analysis Page
- Header: Symbol, current price, change %
- Technical indicators table
- Price chart with SMA/EMA overlays
- RSI/MACD charts below
- Trading signal badge
- Historical decisions

### Sector View
- Sector cards ranked by strength
- Top stocks per sector
- Sector performance comparison chart

---

**Status**: 🚧 In Progress
**Started**: 2025-12-26
**Estimated Time**: 4-6 hours for Phase 1-2

