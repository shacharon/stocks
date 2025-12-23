# Baby Steps Implementation Plan

> **Purpose**: Break down the project into small, testable increments with pause points for discussion.

---

## 🎯 Baby Step Philosophy

Each step should:
- ✅ Be completable in 5-15 minutes
- ✅ Have clear acceptance criteria
- ✅ Be independently testable
- ✅ Provide a natural pause point for discussion

---

## 📍 Current Status: Not Started

---

## Baby Step 1: Monorepo Foundation
**Estimated Time**: 10 minutes  
**Status**: 🔵 READY TO START

### What We'll Create
```
stocks/
├── package.json              (workspace root)
├── pnpm-workspace.yaml       (workspace config)
├── tsconfig.json             (base TS config)
├── .gitignore
├── .env.example
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── worker/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   └── database/
│       ├── package.json
│       └── tsconfig.json
└── README.md
```

### Acceptance Criteria
- [ ] `pnpm install` completes without errors
- [ ] TypeScript recognizes all workspace packages
- [ ] Can import from `@stocks/shared` in other packages

### Questions Before Starting Step 1
1. Project name in package.json: "stocks" or "eod-stock-analyzer"?
2. Git repository initialized or should I create .gitignore only?

---

## Baby Step 2: Docker Infrastructure
**Estimated Time**: 5 minutes  
**Status**: ⚪ PENDING (after Step 1)

### What We'll Create
```
infrastructure/
└── docker-compose.yml     (Postgres 15 + Redis 7)
```

### Services
- **postgres**: Port 5432, volume for persistence
- **redis**: Port 6379, volume for persistence

### Acceptance Criteria
- [ ] `docker-compose up -d` starts both services
- [ ] Can connect to Postgres: `psql -h localhost -U stocks -d stocks`
- [ ] Can connect to Redis: `redis-cli ping` → PONG

### Environment Variables
```env
POSTGRES_USER=stocks
POSTGRES_PASSWORD=stocks
POSTGRES_DB=stocks
```

---

## Baby Step 3: Prisma Schema (Part 1 - Core Tables)
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 2)

### What We'll Create
```
packages/database/
├── prisma/
│   ├── schema.prisma      (6 core tables)
│   └── migrations/        (generated)
└── src/
    └── index.ts           (export PrismaClient)
```

### Tables in This Step
1. `portfolios`
2. `portfolio_positions`
3. `symbol_universe`
4. `symbol_sector_map`
5. `pipeline_runs` ⭐ NEW
6. `job_runs` ⭐ NEW

### Acceptance Criteria
- [ ] `pnpm db:migrate` creates all 6 tables
- [ ] Can import PrismaClient from `@stocks/database`
- [ ] Schema validates (no warnings)

### Questions Before Starting Step 3
1. Use UUID or auto-increment integers for IDs?
2. Default timestamps (created_at/updated_at) on all tables?

---

## Baby Step 4: Prisma Schema (Part 2 - Analysis Tables)
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 3)

### Tables in This Step
7. `market_daily_bars`
8. `daily_symbol_features` ⭐ Portfolio-neutral
9. `portfolio_daily_decisions` ⭐ NEW (overlay)
10. `stop_rules_state`
11. `daily_sector_lists`
12. `deep_dive_reports`
13. `daily_deltas`

### Special Constraints
- `market_daily_bars`: UNIQUE(symbol, market, date)
- `daily_symbol_features`: UNIQUE(symbol, market, date)
- `portfolio_daily_decisions`: UNIQUE(position_id, date)
- `stop_rules_state`: UNIQUE(position_id)

### Acceptance Criteria
- [ ] `pnpm db:migrate` adds all 7 tables
- [ ] All unique constraints enforced
- [ ] Indexes created on key columns

---

## Baby Step 5: Shared Contracts Package
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 4)

### What We'll Create
```
packages/shared/src/
├── contracts/
│   ├── portfolio.ts       (Portfolio, Position interfaces)
│   ├── market.ts          (DailyBar, Market enum)
│   ├── analysis.ts        (Action, Decision, Features)
│   └── jobs.ts            (JobStatus, PipelineRun)
├── schemas/
│   ├── portfolio.schema.ts (Zod validation)
│   └── market.schema.ts
└── index.ts               (exports)
```

### Key Types to Define
```typescript
// Market enum
enum Market { US = 'US', TASE = 'TASE' }

// Action enum
enum Action { HOLD = 'HOLD', MOVE_STOP = 'MOVE_STOP', REDUCE = 'REDUCE', EXIT = 'EXIT' }

// DailyBar interface
interface DailyBar { symbol, date, open, high, low, close, volume }
```

### Acceptance Criteria
- [ ] Can import types in both `web` and `worker`
- [ ] Zod schemas validate correctly
- [ ] TypeScript provides autocomplete

---

## Baby Step 6: Worker NestJS Bootstrap
**Estimated Time**: 15 minutes  
**Status**: ⚪ PENDING (after Step 5)

### What We'll Create
```
apps/worker/src/
├── main.ts                # Bootstrap
├── app.module.ts          # Root module
├── config/
│   └── configuration.ts   # Env config
├── prisma/
│   ├── prisma.module.ts   # Prisma module
│   └── prisma.service.ts  # Prisma service
└── health/
    └── health.controller.ts # GET /health
```

### Dependencies to Install
- @nestjs/common
- @nestjs/core
- @nestjs/platform-express
- @nestjs/config
- @prisma/client
- bullmq
- ioredis

### Acceptance Criteria
- [ ] `pnpm -C apps/worker dev` starts server on port 3001
- [ ] `curl http://localhost:3001/health` returns `{"status":"ok"}`
- [ ] Connects to Postgres successfully
- [ ] Connects to Redis successfully
- [ ] Logs show "Worker service started"

---

## Baby Step 7: BullMQ Configuration
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 6)

### What We'll Create
```
apps/worker/src/
├── queue/
│   ├── queue.module.ts       # BullMQ module
│   ├── queue.config.ts       # Queue config
│   └── queues.constants.ts   # Queue names
└── jobs/
    └── (processors go here later)
```

### Queues to Define
- `eod-pipeline` (main job queue)

### Acceptance Criteria
- [ ] BullMQ connects to Redis
- [ ] Can see queue in Redis: `redis-cli KEYS bull:*`
- [ ] Worker registers as processor
- [ ] No connection errors in logs

---

## Baby Step 8: Universe Manager Module (CRUD)
**Estimated Time**: 15 minutes  
**Status**: ⚪ PENDING (after Step 7)

### What We'll Create
```
apps/worker/src/modules/universe-manager/
├── universe-manager.module.ts
├── universe-manager.controller.ts
├── universe-manager.service.ts
└── dto/
    ├── add-symbol.dto.ts
    └── update-symbol.dto.ts
```

### Endpoints
```
POST   /universe/symbols          # Add symbol
GET    /universe/symbols          # List active symbols
GET    /universe/symbols/:symbol  # Get symbol details
PATCH  /universe/symbols/:symbol  # Update (activate/deactivate)
DELETE /universe/symbols/:symbol  # Soft delete (set is_active=false)
```

### Validation Rules (Zod)
- symbol: required, uppercase, 1-50 chars
- market: enum ['US', 'TASE']

### Acceptance Criteria
- [ ] Can add symbol: `POST /universe/symbols {"symbol":"AAPL","market":"US"}`
- [ ] Returns 400 for invalid market
- [ ] Returns 409 for duplicate symbol+market
- [ ] List endpoint returns active symbols only

---

## Baby Step 9: Universe Manager (CSV Import)
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 8)

### What We'll Add
```
apps/worker/src/modules/universe-manager/
└── universe-manager.service.ts
    └── importFromCSV(file: Buffer): Promise<ImportResult>
```

### CSV Format
```csv
symbol,market
AAPL,US
MSFT,US
GOOGL,US
```

### Endpoint
```
POST /universe/import
Content-Type: multipart/form-data
```

### Acceptance Criteria
- [ ] Can upload CSV and bulk insert symbols
- [ ] Skips duplicates (upsert behavior)
- [ ] Returns summary: `{added: 10, skipped: 2, errors: []}`
- [ ] Validates each row

---

## Baby Step 10: Pipeline Tracking Service
**Estimated Time**: 10 minutes  
**Status**: ⚪ PENDING (after Step 9)

### What We'll Create
```
apps/worker/src/modules/pipeline/
├── pipeline.module.ts
├── pipeline.service.ts      # Track pipeline runs
└── dto/
    ├── start-pipeline.dto.ts
    └── start-job.dto.ts
```

### Key Methods
```typescript
class PipelineService {
  startPipeline(date: Date): Promise<PipelineRun>
  completePipeline(runId: string, status: 'COMPLETED' | 'FAILED'): Promise<void>
  startJob(runId: string, jobType: JobType): Promise<JobRun>
  completeJob(jobId: string, status: 'COMPLETED' | 'FAILED', output?: any): Promise<void>
}
```

### Acceptance Criteria
- [ ] Can create pipeline_run record
- [ ] Can track job_runs within pipeline
- [ ] Enforces unique constraint on run_date
- [ ] Status transitions validated

---

## 🎯 Pause Point: End of Phase 0 + Phase 1 Foundation

**At this point we'll have:**
- ✅ Complete monorepo structure
- ✅ Database with 13 tables
- ✅ Worker service running with health check
- ✅ Universe Manager (CRUD + CSV import)
- ✅ Pipeline tracking infrastructure
- ✅ BullMQ configured

**Time to discuss:**
- Architecture review
- Table design validation
- Next phase priorities (Market Sync vs Web App?)

---

## Baby Step 11-15: Market Sync Module
**Status**: ⚪ NOT PLANNED YET (discuss after Step 10)

**Topics to cover:**
- MarketDataProvider interface
- Stooq adapter implementation
- TASE stub provider
- Market sync job processor
- Rate limiting strategy

---

## Baby Step 16-25: Feature Factory
**Status**: ⚪ NOT PLANNED YET

**Topics to cover:**
- Indicator calculations (SMA, RSI, ATR)
- Levels engine (support/resistance)
- Stop engine (never decrease rule)
- Decision engine (HOLD/MOVE_STOP/EXIT)
- Portfolio decision overlay

---

## Baby Step 26-30: Web App Bootstrap
**Status**: ⚪ NOT PLANNED YET

**Topics to cover:**
- Next.js App Router setup
- Portfolio CRUD UI
- Feature viewer
- API routes

---

## 📋 Implementation Checklist

### Before Starting Each Baby Step
- [ ] Review step requirements
- [ ] Ask clarifying questions
- [ ] Confirm acceptance criteria

### After Completing Each Baby Step
- [ ] Run all tests
- [ ] Verify acceptance criteria
- [ ] Update this document
- [ ] Commit changes
- [ ] **PAUSE and discuss before next step**

### When to Pause and Discuss
- ❓ Unclear requirements
- 🔴 Test failures
- 💭 Architecture questions
- ✅ Major milestone completed (every 5 steps)

---

## 📞 Decision Log

### Decision 1: Database IDs
**Date**: Pending  
**Question**: UUID vs auto-increment integers?  
**Decision**: TBD  
**Rationale**: 

### Decision 2: Package Naming
**Date**: Pending  
**Question**: "stocks" vs "eod-stock-analyzer"?  
**Decision**: TBD  
**Rationale**: 

### Decision 3: CSV Import Library
**Date**: Pending  
**Question**: Which CSV parser? (papaparse, csv-parse, etc.)  
**Decision**: TBD  
**Rationale**: 

---

## 🚀 Ready to Start?

**Current Position**: Baby Step 1  
**Status**: 🔵 Ready to begin

**Before we start Baby Step 1, please confirm:**
1. [ ] You've reviewed PROJECT-STARTUP.md
2. [ ] Database schema approach is acceptable
3. [ ] Portfolio-neutral features + overlay design confirmed
4. [ ] Ready to create initial file structure

**To begin Baby Step 1, say**: "Start Baby Step 1" or "Let's begin"

---

**Document Version**: 1.0  
**Last Updated**: Dec 23, 2025  
**Next Review**: After Step 10

