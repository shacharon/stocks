# EOD Stock Analyzer — Project Startup Guide

> **Status**: Foundation Phase  
> **Architecture**: AWS-Native Microservices (Next.js Web + NestJS Worker)  
> **Last Updated**: Dec 23, 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Repository Structure](#repository-structure)
5. [Database Design](#database-design)
6. [Implementation Phases](#implementation-phases)
7. [Local Development Setup](#local-development-setup)
8. [Related Documentation](#related-documentation)

---

## 🎯 Project Overview

### Mission
Build a deterministic, EOD-only stock analysis system that:
- Processes 10-800 symbols daily after market close
- Produces normalized features and risk-based actions per symbol
- Provides sector-based rankings and change detection
- Enforces stop-loss never decreases rule
- Operates with zero LLM decision-making (deterministic only)

### Core Principles
- **EOD ONLY**: No intraday, no real-time
- **Deterministic**: Same inputs → Same outputs (always)
- **Risk-First**: No buy recommendations, only risk management
- **Auditable**: Full pipeline tracking and versioning
- **Uncertainty Handling**: When in doubt → HOLD

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│                                                             │
│  ┌──────────────┐                    ┌──────────────┐     │
│  │  EventBridge │───── Daily ───────▶│    Worker    │     │
│  │   Scheduler  │     Trigger        │   (NestJS)   │     │
│  └──────────────┘                    └───────┬──────┘     │
│                                              │             │
│                                              ▼             │
│  ┌──────────────┐                    ┌──────────────┐     │
│  │     Web      │◀──── REST ────────▶│    BullMQ    │     │
│  │  (Next.js)   │      APIs          │   (Redis)    │     │
│  └──────┬───────┘                    └──────────────┘     │
│         │                                                  │
│         └──────────┬──────────────────────────┘           │
│                    ▼                                       │
│         ┌──────────────────────┐                          │
│         │   PostgreSQL (RDS)   │                          │
│         └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Web Service** (`apps/web`)
   - Next.js 14 with App Router
   - Portfolio CRUD
   - Feature viewers
   - Deep-dive trigger

2. **Worker Service** (`apps/worker`)
   - NestJS batch processor
   - BullMQ job orchestration
   - 7 core modules (see below)

3. **Shared Packages**
   - `packages/shared`: TypeScript contracts + Zod schemas
   - `packages/database`: Prisma schema + migrations

---

## 🛠️ Technology Stack

### Runtime & Language
- **Node.js**: v20 LTS
- **TypeScript**: v5.x (strict mode)
- **Package Manager**: pnpm v8+

### Frameworks
- **Web**: Next.js 14 (App Router)
- **Worker**: NestJS 10
- **Validation**: Zod
- **ORM**: Prisma

### Infrastructure (Local Dev)
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Container**: Docker + Docker Compose

### Infrastructure (AWS Production)
- **Compute**: ECS Fargate
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Scheduling**: EventBridge
- **Secrets**: Secrets Manager
- **Observability**: CloudWatch

### Job Orchestration
- **Queue**: BullMQ
- **Scheduling**: EventBridge (production) / Cron (local)

---

## 📁 Repository Structure

```
stocks/
├── apps/
│   ├── web/                          # Next.js Web Application
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── api/              # API routes
│   │   │   │   ├── portfolios/       # Portfolio pages
│   │   │   │   ├── features/         # Feature viewer pages
│   │   │   │   └── layout.tsx
│   │   │   ├── components/           # React components
│   │   │   └── lib/                  # Utilities
│   │   ├── public/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── next.config.js
│   │
│   └── worker/                       # NestJS Worker Service
│       ├── src/
│       │   ├── main.ts               # Bootstrap
│       │   ├── app.module.ts         # Root module
│       │   ├── config/               # Configuration
│       │   ├── modules/              # Feature modules
│       │   │   ├── universe-manager/     # Module A
│       │   │   ├── sector-classification/# Module B
│       │   │   ├── market-sync/          # Module C
│       │   │   ├── feature-factory/      # Module D
│       │   │   ├── sector-selector/      # Module E
│       │   │   ├── deep-inspector/       # Module F
│       │   │   └── change-detector/      # Module G
│       │   ├── jobs/                 # Job processors
│       │   │   ├── market-sync.processor.ts
│       │   │   ├── feature-factory.processor.ts
│       │   │   └── ...
│       │   └── common/               # Shared utilities
│       ├── test/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                       # Shared Contracts
│   │   ├── src/
│   │   │   ├── contracts/            # TypeScript interfaces
│   │   │   │   ├── portfolio.ts
│   │   │   │   ├── market.ts
│   │   │   │   ├── analysis.ts
│   │   │   │   └── jobs.ts
│   │   │   ├── schemas/              # Zod validation schemas
│   │   │   │   ├── portfolio.schema.ts
│   │   │   │   └── ...
│   │   │   └── types/                # Shared types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── database/                     # Prisma Package
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   ├── migrations/           # Migration history
│       │   └── seed.ts               # Seed data
│       ├── src/
│       │   └── index.ts              # Prisma client export
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                   # Deployment Configs
│   ├── docker-compose.yml            # Local development
│   ├── docker-compose.prod.yml       # Production-like local
│   ├── ecs-task-web.json             # ECS task: web
│   ├── ecs-task-worker.json          # ECS task: worker
│   └── README-AWS.md                 # AWS deployment guide
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # System architecture
│   ├── DATABASE.md                   # Database design
│   ├── MODULES.md                    # Module specifications
│   ├── API.md                        # API reference
│   ├── JOBS.md                       # Job pipeline docs
│   └── DEPLOYMENT.md                 # Deployment guide
│
├── scripts/                          # Utility scripts
│   ├── setup-local.sh                # Local environment setup
│   ├── seed-universe.ts              # Seed symbol universe
│   └── run-pipeline.ts               # Manual pipeline trigger
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD pipeline
│
├── pnpm-workspace.yaml               # Workspace config
├── package.json                      # Root package
├── tsconfig.json                     # Root TS config
├── .gitignore
├── .env.example                      # Environment template
├── README.md                         # Main readme
└── PROJECT-STARTUP.md                # This file
```

---

## 🗄️ Database Design

### Core Entities (12 Tables)

#### 1. Portfolio Management
```sql
-- portfolios: User portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- portfolio_positions: Positions with buy price
CREATE TABLE portfolio_positions (
  id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id),
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('US', 'TASE')),
  buy_price DECIMAL(12,4) NOT NULL CHECK (buy_price > 0),
  quantity DECIMAL(12,4),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 2. Universe Management
```sql
-- symbol_universe: Active symbols (10-800)
CREATE TABLE symbol_universe (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('US', 'TASE')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market)
);

-- symbol_sector_map: Sector classification
CREATE TABLE symbol_sector_map (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  industry VARCHAR(100),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol)
);
```

#### 3. Market Data
```sql
-- market_daily_bars: EOD OHLCV data
CREATE TABLE market_daily_bars (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('US', 'TASE')),
  date DATE NOT NULL,
  open DECIMAL(12,4) NOT NULL,
  high DECIMAL(12,4) NOT NULL,
  low DECIMAL(12,4) NOT NULL,
  close DECIMAL(12,4) NOT NULL,
  volume BIGINT NOT NULL,
  source VARCHAR(50) NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market, date)
);
CREATE INDEX idx_market_bars_symbol_date ON market_daily_bars(symbol, market, date DESC);
```

#### 4. Pipeline Tracking (NEW)
```sql
-- pipeline_runs: Track full pipeline executions
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY,
  run_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  UNIQUE (run_date)
);

-- job_runs: Track individual job executions
CREATE TABLE job_runs (
  id UUID PRIMARY KEY,
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id),
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
    'MARKET_SYNC', 'FEATURE_FACTORY', 'SECTOR_SELECTOR', 
    'CHANGE_DETECTOR', 'DEEP_DIVE'
  )),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  input_data JSONB,
  output_data JSONB,
  UNIQUE (pipeline_run_id, job_type)
);
CREATE INDEX idx_job_runs_pipeline ON job_runs(pipeline_run_id);
```

#### 5. Analysis Outputs (Portfolio-Neutral)
```sql
-- daily_symbol_features: Portfolio-agnostic analysis
CREATE TABLE daily_symbol_features (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL CHECK (market IN ('US', 'TASE')),
  date DATE NOT NULL,
  
  -- Price data
  close_price DECIMAL(12,4) NOT NULL,
  
  -- Indicators
  sma_20 DECIMAL(12,4),
  sma_50 DECIMAL(12,4),
  rsi_14 DECIMAL(8,4),
  atr_14 DECIMAL(12,4),
  volume_avg_20 BIGINT,
  
  -- Levels
  support_levels JSONB,  -- [{price, strength, touches}]
  resistance_levels JSONB,
  
  -- Regime
  trend VARCHAR(20),  -- 'BULLISH', 'BEARISH', 'SIDEWAYS'
  volatility_state VARCHAR(20),  -- 'LOW', 'NORMAL', 'HIGH'
  
  -- Engine metadata
  engine_version VARCHAR(20) NOT NULL,
  confidence DECIMAL(4,3),
  reasons JSONB,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market, date)
);
CREATE INDEX idx_features_symbol_date ON daily_symbol_features(symbol, market, date DESC);
```

#### 6. Portfolio-Specific Overlays (NEW)
```sql
-- portfolio_daily_decisions: Buy-price aware decisions
CREATE TABLE portfolio_daily_decisions (
  id UUID PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES portfolio_positions(id),
  date DATE NOT NULL,
  
  -- Context
  buy_price DECIMAL(12,4) NOT NULL,
  current_price DECIMAL(12,4) NOT NULL,
  
  -- Stop-loss (NEVER DECREASES)
  suggested_stop DECIMAL(12,4) NOT NULL,
  prev_stop DECIMAL(12,4),
  stop_distance_pct DECIMAL(6,3),
  
  -- Action
  action VARCHAR(20) NOT NULL CHECK (action IN ('HOLD', 'MOVE_STOP', 'REDUCE', 'EXIT')),
  action_confidence DECIMAL(4,3),
  action_reasons JSONB,
  
  -- Reference to universal features
  feature_id UUID REFERENCES daily_symbol_features(id),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (position_id, date)
);
CREATE INDEX idx_decisions_position_date ON portfolio_daily_decisions(position_id, date DESC);

-- stop_rules_state: Current stop per position
CREATE TABLE stop_rules_state (
  id UUID PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES portfolio_positions(id),
  current_stop DECIMAL(12,4) NOT NULL,
  last_moved_at DATE NOT NULL,
  history JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (position_id)
);
```

#### 7. Sector Analysis
```sql
-- daily_sector_lists: Top 10 per sector
CREATE TABLE daily_sector_lists (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  sector VARCHAR(100) NOT NULL,
  symbol_list JSONB NOT NULL,  -- [{symbol, score, rank}]
  ranking_criteria JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (date, sector)
);
```

#### 8. Deep Dive & Changes
```sql
-- deep_dive_reports: On-demand heavy analysis
CREATE TABLE deep_dive_reports (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market, date)
);

-- daily_deltas: Material changes
CREATE TABLE daily_deltas (
  id UUID PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  market VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  materiality_score DECIMAL(4,3),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market, date, change_type)
);
CREATE INDEX idx_deltas_date_materiality ON daily_deltas(date DESC, materiality_score DESC);
```

---

## 🚀 Implementation Phases

### Phase 0: Foundation (Baby Step 1)
**Goal**: Monorepo structure + database ready

- [x] Create pnpm workspace
- [x] Setup TypeScript configs (strict)
- [x] Add docker-compose.yml (Postgres + Redis)
- [x] Create Prisma schema (12 tables)
- [x] Generate migrations

**Deliverable**: Can run `pnpm install && docker-compose up && pnpm db:migrate`

---

### Phase 1: Worker Bootstrap (Baby Step 2)
**Goal**: Worker service running with health check

- [ ] Setup NestJS in `apps/worker`
- [ ] Configure BullMQ + Redis connection
- [ ] Add ConfigModule (env vars)
- [ ] Create PrismaModule (global)
- [ ] Implement GET /health endpoint

**Deliverable**: `curl http://localhost:3001/health` returns `{"status":"ok"}`

---

### Phase 2: Universe Manager (Baby Step 3)
**Goal**: Can manage symbol universe

- [ ] Create UniverseManagerModule
- [ ] CRUD operations for symbol_universe
- [ ] CSV import functionality
- [ ] Unit tests

**Deliverable**: Can add/remove symbols via API + import CSV

---

### Phase 3: Market Sync (Baby Step 4-5)
**Goal**: Can fetch and store EOD bars

- [ ] Create MarketSyncModule
- [ ] Define MarketDataProvider interface
- [ ] Implement StooqProvider (US)
- [ ] Implement TASEStubProvider (empty)
- [ ] Create MarketSyncJob + processor
- [ ] Pipeline tracking integration

**Deliverable**: Manual trigger stores bars in DB with pipeline_run record

---

### Phase 4: Feature Factory (Baby Steps 6-10)
**Goal**: Daily analysis engine working

- [ ] IndicatorService (SMA, RSI, ATR)
- [ ] LevelsEngine (support/resistance)
- [ ] StopEngine (NEVER DECREASES rule)
- [ ] DecisionEngine (HOLD/MOVE_STOP/EXIT)
- [ ] FeatureFactoryJob + processor
- [ ] Integration with daily_symbol_features
- [ ] Portfolio decision overlay (portfolio_daily_decisions)

**Deliverable**: Run analysis, verify stop invariant holds

---

### Phase 5: Web App Basics (Baby Steps 11-13)
**Goal**: UI to view data

- [ ] Setup Next.js in `apps/web`
- [ ] Portfolio CRUD APIs + UI
- [ ] Feature viewer (latest + history)
- [ ] Redis caching layer

**Deliverable**: Can create portfolio, view features via UI

---

### Phase 6-8: Remaining Modules
- Sector Selector (Phase 6)
- Change Detector (Phase 7)
- Deep Inspector (Phase 8)

---

## 💻 Local Development Setup

### Prerequisites
```bash
# Required
node >= 20.0.0
pnpm >= 8.0.0
docker >= 24.0.0
docker-compose >= 2.0.0

# Optional
postgresql-client (for CLI access)
redis-cli (for queue inspection)
```

### Initial Setup
```bash
# 1. Clone repo
git clone <repo-url>
cd stocks

# 2. Install dependencies
pnpm install

# 3. Start infrastructure
docker-compose up -d

# 4. Setup database
cd packages/database
pnpm prisma:migrate
pnpm prisma:seed

# 5. Start services
# Terminal 1: Worker
cd apps/worker
pnpm dev

# Terminal 2: Web (later phase)
cd apps/web
pnpm dev
```

### Environment Variables
Create `.env` in workspace root:
```bash
# Database
DATABASE_URL="postgresql://stocks:stocks@localhost:5432/stocks"

# Redis
REDIS_URL="redis://localhost:6379"

# Services
WORKER_PORT=3001
WEB_PORT=3000

# Development
NODE_ENV="development"
LOG_LEVEL="debug"
```

---

## 📚 Related Documentation

### Core Documents
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design, flows, patterns
- [DATABASE.md](docs/DATABASE.md) - Schema details, indexes, migrations
- [MODULES.md](docs/MODULES.md) - Module specifications (A-G)
- [API.md](docs/API.md) - API reference (Web + Worker)
- [JOBS.md](docs/JOBS.md) - Job pipeline, orchestration, scheduling

### Development Guides
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - AWS deployment guide
- [TESTING.md](docs/TESTING.md) - Testing strategy, invariants
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Code style, PR process

### Reference
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues

---

## 🎯 Current Status: Phase 0 Ready

**Next Steps:**
1. Review this document
2. Confirm architecture and database design
3. Begin Phase 0 implementation (Baby Step 1)

**Decision Points Before Starting:**
- [ ] Database table structure approved?
- [ ] Portfolio-neutral features + overlay approach confirmed?
- [ ] Pipeline tracking design accepted?
- [ ] Ready to create initial file structure?

---

## 📞 Contact & Support

For questions or clarifications, refer to:
- Original spec: [PROJECT-SPEC.md](#)
- Architecture decisions: [docs/ARCHITECTURE.md](#)
- Team discussions: [Internal wiki/Slack](#)

---

**Document Version**: 1.0  
**Last Updated**: Dec 23, 2025  
**Status**: Ready for Phase 0 Implementation

