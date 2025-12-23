# Baby Step 3 - Setup Guide

## ✅ Progress So Far

- ✅ Prisma schema created (13 tables)
- ✅ pnpm installed (v8.15.0)
- ✅ Dependencies installed (868 packages)
- ⚠️ Docker Desktop not running

---

## 🐳 Next: Start Docker Desktop

### Step 1: Start Docker Desktop

**On Windows:**
1. Press `Windows` key
2. Type "Docker Desktop"
3. Click to open
4. Wait for Docker to fully start (whale icon in system tray turns static)

**Verify Docker is running:**
```bash
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```
(Empty list is OK - means Docker is running)

---

### Step 2: Start Containers

```bash
cd c:\dev\stocks
pnpm dev:up
```

**Expected output:**
```
[+] Running 3/3
 ✔ Network stocks_stocks-network  Created
 ✔ Container stocks-postgres      Started
 ✔ Container stocks-redis         Started
```

---

### Step 3: Verify Containers

```bash
pnpm dev:ps
```

**Expected:**
```
NAME              IMAGE                STATUS         PORTS
stocks-postgres   postgres:15-alpine   Up X seconds   0.0.0.0:5432->5432/tcp
stocks-redis      redis:7-alpine       Up X seconds   0.0.0.0:6379->6379/tcp
```

---

### Step 4: Generate Prisma Client

```bash
pnpm db:generate
```

**Expected:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

### Step 5: Run Migration (Create Tables)

```bash
pnpm db:migrate
```

**You'll be asked for a migration name. Type:**
```
init_schema
```

**Expected:**
```
Applying migration `20XXXXXX_init_schema`

The following migration(s) have been created and applied:

migrations/
  └─ 20XXXXXX_init_schema/
      └─ migration.sql

✔ Generated Prisma Client
```

---

### Step 6: Verify Tables Created

```bash
docker exec -it stocks-postgres psql -U stocks -d stocks -c "\dt"
```

**Expected:** List of all 13 tables:
```
                  List of relations
 Schema |           Name            | Type  | Owner
--------+---------------------------+-------+--------
 public | daily_deltas              | table | stocks
 public | daily_sector_lists        | table | stocks
 public | daily_symbol_features     | table | stocks
 public | deep_dive_reports         | table | stocks
 public | job_runs                  | table | stocks
 public | market_daily_bars         | table | stocks
 public | pipeline_runs             | table | stocks
 public | portfolio_daily_decisions | table | stocks
 public | portfolio_positions       | table | stocks
 public | portfolios                | table | stocks
 public | stop_rules_state          | table | stocks
 public | symbol_sector_map         | table | stocks
 public | symbol_universe           | table | stocks
```

---

### Step 7: Open Prisma Studio (Optional)

```bash
pnpm db:studio
```

Opens: **http://localhost:5555**

You'll see all 13 tables in a GUI where you can:
- Browse data
- Add test records
- Explore relationships

---

## ✅ Baby Step 3 Complete Checklist

- [x] Prisma schema created
- [x] pnpm installed
- [x] Dependencies installed
- [ ] Docker Desktop started
- [ ] Containers running
- [ ] Prisma client generated
- [ ] Migration run successfully
- [ ] Tables visible in database

---

## 🐛 Troubleshooting

### Docker not starting?

**Check Docker Desktop:**
```bash
# Windows: Check if process is running
Get-Process *docker*
```

**If Docker is installed but won't start:**
1. Restart Docker Desktop
2. Check Windows Services - Docker Desktop Service should be running
3. Try running as Administrator

### Port conflicts?

**If port 5432 or 6379 is in use:**

**Option A: Change ports in docker-compose.yml**
```yaml
# infrastructure/docker-compose.yml
services:
  postgres:
    ports:
      - '5433:5432'  # Use 5433 instead
  redis:
    ports:
      - '6380:6379'  # Use 6380 instead
```

**Then update .env:**
```
DATABASE_URL="postgresql://stocks:stocks@localhost:5433/stocks"
REDIS_URL="redis://localhost:6380"
```

**Option B: Stop conflicting services**
```bash
# Find what's using port 5432
netstat -ano | findstr :5432

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Migration fails with connection error?

**Check:**
1. Docker containers are running: `pnpm dev:ps`
2. DATABASE_URL is correct in `.env`
3. Postgres is healthy: `docker logs stocks-postgres`

---

## 🎯 What You'll Have After This

### Database with 13 Tables:

1. **portfolios** - Store user portfolios
2. **portfolio_positions** - Positions with buy prices
3. **symbol_universe** - Active symbols (10-800)
4. **symbol_sector_map** - Sector classification
5. **pipeline_runs** - Pipeline execution tracking
6. **job_runs** - Individual job tracking
7. **market_daily_bars** - EOD OHLCV data
8. **daily_symbol_features** - Portfolio-neutral analysis
9. **portfolio_daily_decisions** - Buy-price aware decisions
10. **stop_rules_state** - Stop-loss tracking
11. **daily_sector_lists** - Top 10 per sector
12. **deep_dive_reports** - On-demand analysis
13. **daily_deltas** - Material changes

### Ready to Use:

```bash
# Database GUI
pnpm db:studio

# Check containers
pnpm dev:ps

# View logs
pnpm dev:logs

# Stop containers
pnpm dev:down
```

---

## 🚀 After Completing Baby Step 3

You can move to **Baby Step 4: Shared Contracts**

This will create:
- TypeScript interfaces matching Prisma models
- Zod validation schemas
- Type-safe API contracts

---

## 📊 Progress

**Completed**: 3/10 (30%)  
**Current**: Baby Step 3 - Prisma Schema  
**Next**: Baby Step 4 - Shared Contracts

---

**Start Docker Desktop → Run the 7 steps above → Report back!** 🚀

