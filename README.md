# EOD Stock Analyzer — AWS-Native System

> Deterministic, EOD-only stock analysis system with microservices architecture  
> **Status**: Foundation Phase — Baby Step 1 Ready  
> **Last Updated**: Dec 23, 2025

---

## 🚀 Quick Start

### 📖 Start Here (Read in Order)

1. **[PROJECT-STARTUP.md](PROJECT-STARTUP.md)** ⭐ **READ FIRST**
   - Complete project overview
   - System architecture
   - Database design (13 tables)
   - Technology stack
   - Repository structure

2. **[BABY-STEPS.md](BABY-STEPS.md)** ⭐ **IMPLEMENTATION GUIDE**
   - Step-by-step implementation plan
   - 10 initial baby steps with pause points
   - Acceptance criteria for each step
   - Decision log

3. **This README** — Quick reference and status tracker

---

## 🎯 What We're Building

A cloud-native stock analyzer that:
- Processes **10-800 symbols** daily after market close
- Produces **deterministic analysis** (no LLM decision-making)
- Enforces **stop-loss never decreases** rule
- Provides **sector rankings** and **change detection**
- Operates on **AWS infrastructure** (ECS Fargate + RDS + Redis)

### Core Modules (7)
| Module | Purpose | Status |
|--------|---------|--------|
| **A. Universe Manager** | Manage symbol universe (10-800) | 🔵 Next |
| **B. Sector Classification** | Map symbol → sector | ⚪ Planned |
| **C. Market Data Sync** | Fetch EOD bars | ⚪ Planned |
| **D. Feature Factory** | Daily analysis engine | ⚪ Planned |
| **E. Sector Selector** | Top 10 per sector | ⚪ Planned |
| **F. Deep Inspector** | On-demand deep analysis | ⚪ Planned |
| **G. Change Detector** | Material changes detector | ⚪ Planned |

---

## 📁 Repository Structure

```
stocks/
├── 📄 README.md                    ← You are here
├── 📄 PROJECT-STARTUP.md           ← Complete project guide
├── 📄 BABY-STEPS.md                ← Implementation roadmap
│
├── apps/
│   ├── web/                        ← Next.js UI (Phase 5+)
│   └── worker/                     ← NestJS batch processor
│
├── packages/
│   ├── shared/                     ← TypeScript contracts
│   └── database/                   ← Prisma schema
│
├── infrastructure/
│   └── docker-compose.yml          ← Local dev (Postgres + Redis)
│
└── docs/                           ← Detailed documentation
```

---

## 🗄️ Database Design Highlights

### Key Innovation: Portfolio-Neutral Analysis

**Problem**: Don't want to re-analyze same symbol for every portfolio.

**Solution**: Two-layer architecture

**Layer 1: Universal Features** (portfolio-agnostic)
```
daily_symbol_features
├── symbol, market, date
├── indicators (SMA, RSI, ATR)
├── levels (support/resistance)
├── regime (trend, volatility)
└── UNIQUE(symbol, market, date)
```

**Layer 2: Portfolio Overlays** (buy-price aware)
```
portfolio_daily_decisions
├── position_id (references portfolio_positions)
├── buy_price, current_price
├── suggested_stop (NEVER DECREASES)
├── action (HOLD/MOVE_STOP/EXIT)
└── feature_id (references daily_symbol_features)
```

### Pipeline Tracking (Idempotency)
```
pipeline_runs         → Full pipeline execution per date
├── UNIQUE(run_date)  → Idempotency key
└── status tracking

job_runs              → Individual job tracking
└── UNIQUE(pipeline_run_id, job_type)
```

**Total Tables**: 13

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Runtime** | Node.js 20 LTS |
| **Package Manager** | pnpm workspaces |
| **Web Framework** | Next.js 14 (App Router) |
| **Worker Framework** | NestJS 10 |
| **Database** | PostgreSQL 15 |
| **Cache/Queue** | Redis 7 |
| **Job Orchestration** | BullMQ |
| **ORM** | Prisma |
| **Validation** | Zod |
| **AWS Compute** | ECS Fargate |
| **AWS Database** | RDS PostgreSQL |
| **AWS Cache** | ElastiCache Redis |
| **AWS Scheduling** | EventBridge |

---

## 📊 System Flow (Daily Pipeline)

```
EventBridge (Daily Trigger)
    ↓
[Job 1] Market Sync ────────→ Fetch EOD bars → market_daily_bars
    ↓
[Job 2] Feature Factory ────→ Analyze symbols → daily_symbol_features
    ↓                          ↓
    │                   Apply portfolio context → portfolio_daily_decisions
    ↓
[Job 3] Sector Selector ────→ Rank by sector → daily_sector_lists
    ↓
[Job 4] Change Detector ────→ Compare vs yesterday → daily_deltas
    ↓
Pipeline Complete (Data ready for Web UI)
```

---

## 🎯 Current Status

### Implementation Progress

| Phase | Status | Steps Completed |
|-------|--------|-----------------|
| **Phase 0**: Foundation | 🔵 Ready | 0/4 |
| **Phase 1**: Worker Bootstrap | ⚪ Not Started | 0/6 |
| **Phase 2**: Market Sync | ⚪ Planned | 0/5 |
| **Phase 3**: Feature Factory | ⚪ Planned | 0/10 |
| **Phase 4**: Web App | ⚪ Planned | 0/4 |
| **Phase 5+**: Advanced Modules | ⚪ Planned | — |

**Current Baby Step**: 1 of 10 (Foundation)  
**Next Milestone**: End of Phase 1 (Step 10)

---

## 🏁 Getting Started (Once Implementation Begins)

### Prerequisites
```bash
# Check versions
node --version    # Should be >= 20.0.0
pnpm --version    # Should be >= 8.0.0
docker --version  # Should be >= 24.0.0
```

### Local Development (After Baby Step 6)
```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure
docker-compose up -d

# 3. Run migrations
pnpm db:migrate

# 4. Start worker service
pnpm -C apps/worker dev

# 5. Health check
curl http://localhost:3001/health
```

### Environment Setup
```bash
# Copy example environment
cp .env.example .env

# Edit with your settings
nano .env
```

**Required Variables**:
```env
DATABASE_URL="postgresql://stocks:stocks@localhost:5432/stocks"
REDIS_URL="redis://localhost:6379"
WORKER_PORT=3001
NODE_ENV="development"
```

---

## 🧪 Testing Strategy

### Invariant Tests (Critical)
```typescript
// Stop-loss never decreases
test('stop invariant holds across consecutive days', async () => {
  const day1 = await runAnalysis('2024-01-01', { prevStop: 100 });
  const day2 = await runAnalysis('2024-01-02');
  expect(day2.stop).toBeGreaterThanOrEqual(day1.stop);
});

// Deterministic outputs
test('same inputs produce same outputs', async () => {
  const run1 = await runAnalysis('2024-01-01', inputs);
  const run2 = await runAnalysis('2024-01-01', inputs);
  expect(run1).toEqual(run2);
});
```

---

## 📚 Documentation Map

### Core Documents (Created)
- ✅ [README.md](README.md) — This file
- ✅ [PROJECT-STARTUP.md](PROJECT-STARTUP.md) — Complete project guide
- ✅ [BABY-STEPS.md](BABY-STEPS.md) — Implementation roadmap

### Documents to Create (Future)
- [ ] docs/ARCHITECTURE.md — System design deep-dive
- [ ] docs/DATABASE.md — Schema documentation
- [ ] docs/MODULES.md — Module specifications
- [ ] docs/API.md — API reference
- [ ] docs/JOBS.md — Job pipeline documentation
- [ ] docs/TESTING.md — Testing guide
- [ ] docs/DEPLOYMENT.md — AWS deployment guide

---

## 🎬 Next Actions

### Before Starting Implementation

1. **Read Project Documents** (15 min)
   - [ ] Read [PROJECT-STARTUP.md](PROJECT-STARTUP.md) fully
   - [ ] Review database design section
   - [ ] Understand module breakdown

2. **Review Baby Steps** (10 min)
   - [ ] Read [BABY-STEPS.md](BABY-STEPS.md) steps 1-10
   - [ ] Note pause points and acceptance criteria
   - [ ] Prepare questions

3. **Make Architecture Decisions** (5 min)
   - [ ] UUID vs auto-increment IDs?
   - [ ] Project name preference?
   - [ ] Any database schema concerns?

4. **Begin Baby Step 1**
   - Say: **"Start Baby Step 1"** or **"Let's begin"**

---

## 💡 Key Design Principles

### 1. Deterministic Analysis
- Same inputs → Same outputs (always)
- No randomness, no LLM decisions
- Reproducible and auditable

### 2. Stop-Loss Invariant
- Stop can only stay same or move up
- Never decreases across consecutive days
- Enforced in StopEngine + tests

### 3. Uncertainty Handling
- If confidence < 0.6 → Force HOLD
- Insufficient data → HOLD with reason
- Provider failure → Log and retry

### 4. Portfolio-Neutral Features
- Analyze each symbol once per day
- Store universal features
- Apply portfolio context as overlay

### 5. Idempotent Pipeline
- Each run tracked with unique run_date
- Jobs can be retried safely
- State transitions validated

---

## 📞 Support & Questions

**Have questions before starting?**
- Review the decision log in [BABY-STEPS.md](BABY-STEPS.md)
- Check acceptance criteria for each step
- Ask for clarification at any pause point

**During implementation:**
- Complete each baby step fully
- Verify acceptance criteria
- **Pause and discuss** before next step

---

## 🎯 Success Criteria (MVP)

### Technical Goals
- [ ] Pipeline processes 800 symbols in < 30 minutes
- [ ] Stop invariant holds 100% of time (tested)
- [ ] Determinism verified (integration tests pass)
- [ ] Web pages load in < 2 seconds
- [ ] Can deploy to AWS ECS

### Business Goals
- [ ] Can manage 10-800 symbol universe
- [ ] Daily features generated automatically
- [ ] Portfolio-specific decisions with buy-price context
- [ ] Material changes detected and highlighted
- [ ] On-demand deep analysis available

---

## 📜 License

TBD

---

## 📝 Changelog

### [Unreleased] - Foundation Phase
- Created project structure documents
- Defined database schema (13 tables)
- Designed portfolio-neutral architecture
- Created baby steps implementation plan

---

**Ready to Build?** → Read [PROJECT-STARTUP.md](PROJECT-STARTUP.md) then [BABY-STEPS.md](BABY-STEPS.md)  
**Have Questions?** → Review documents first, then ask at any pause point  
**Let's Start!** → Say "Start Baby Step 1" when ready

---

**Project Status**: 🔵 Ready for Implementation  
**Next Step**: Baby Step 1 — Monorepo Foundation  
**Version**: 0.1.0-alpha  
**Last Updated**: Dec 23, 2025

