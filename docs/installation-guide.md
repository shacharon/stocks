# Installation Guide — Baby Step 2

## 🎯 Goal

Get your local development environment running with:
- ✅ pnpm installed
- ✅ Docker containers running (Postgres + Redis)
- ✅ Database ready for migrations

---

## Step 1: Check pnpm Installation

Run this command to check if pnpm is installed:

```bash
pnpm check:pnpm
```

### If pnpm is NOT Installed

Choose one of these methods:

#### Option A: Using npm (Easiest)
```bash
npm install -g pnpm@8.15.0
```

#### Option B: Using PowerShell (Windows)
```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

#### Option C: Using Chocolatey (Windows)
```bash
choco install pnpm
```

#### Option D: Using Scoop (Windows)
```bash
scoop install pnpm
```

After installation, verify:
```bash
pnpm --version
# Should output: 8.15.0 (or similar)
```

---

## Step 2: Install Project Dependencies

```bash
cd c:\dev\stocks
pnpm install
```

**Expected output**:
```
Scope: all 4 workspace projects
Packages: +XXX
+++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded X, added XXX
Done in Xs
```

**Verify installation**:
```bash
pnpm -r list
```

---

## Step 3: Start Docker Services

### Check Docker is Running

```bash
docker --version
# Should output: Docker version XX.X.X
```

If Docker is not installed:
- Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/

### Start Postgres + Redis

```bash
pnpm dev:up
```

**Expected output**:
```
[+] Running 3/3
 ✔ Network stocks_stocks-network  Created
 ✔ Container stocks-postgres      Started
 ✔ Container stocks-redis         Started
```

### Verify Containers Are Running

```bash
pnpm dev:ps
```

**Expected output**:
```
NAME              IMAGE                COMMAND                  STATUS         PORTS
stocks-postgres   postgres:15-alpine   "docker-entrypoint..."   Up X seconds   0.0.0.0:5432->5432/tcp
stocks-redis      redis:7-alpine       "docker-entrypoint..."   Up X seconds   0.0.0.0:6379->6379/tcp
```

---

## Step 4: Verify Database Connection

### Test Postgres Connection

**Option A: Using psql (if installed)**
```bash
psql -h localhost -U stocks -d stocks
# Password: stocks
```

**Option B: Using Docker exec**
```bash
docker exec -it stocks-postgres psql -U stocks -d stocks
```

Inside psql:
```sql
\l              -- List databases
\q              -- Quit
```

### Test Redis Connection

**Option A: Using redis-cli (if installed)**
```bash
redis-cli ping
# Should output: PONG
```

**Option B: Using Docker exec**
```bash
docker exec -it stocks-redis redis-cli ping
# Should output: PONG
```

---

## Step 5: Setup Database Schema (Ready for Baby Step 3)

**Note**: This step will be completed in Baby Step 3 when we create the Prisma schema.

Preview commands (will use later):
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

---

## 🔧 Useful Commands

### Docker Management
```bash
# Start services
pnpm dev:up

# Stop services (keeps data)
pnpm dev:down

# View logs
pnpm dev:logs

# Check status
pnpm dev:ps
```

### Database Commands (After Baby Step 3)
```bash
# Generate Prisma client
pnpm db:generate

# Create and run migration
pnpm db:migrate

# Open Prisma Studio GUI
pnpm db:studio

# Push schema without migration
pnpm -C packages/database db:push
```

### Cleanup Commands
```bash
# Stop containers and remove volumes (DESTRUCTIVE)
docker compose -f infrastructure/docker-compose.yml down -v

# Clean all build artifacts
pnpm clean
```

---

## 🐛 Troubleshooting

### Issue: Port 5432 already in use

**Solution**: Another Postgres instance is running
```bash
# Windows: Find process using port
netstat -ano | findstr :5432

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - '5433:5432'  # Use 5433 on host
```

### Issue: Port 6379 already in use

**Solution**: Another Redis instance is running
```bash
# Windows: Find process using port
netstat -ano | findstr :6379

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Docker not starting

**Solution**: Check Docker Desktop is running
- Open Docker Desktop
- Wait for it to fully start
- Try `docker ps` to verify

### Issue: pnpm command not found after install

**Solution**: Restart terminal/PowerShell
```bash
# Close and reopen terminal
# Or reload PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

## ✅ Baby Step 2 Acceptance Criteria

Verify these are all working:

- [ ] `pnpm --version` shows 8.15.0+
- [ ] `pnpm install` completed successfully
- [ ] `pnpm dev:up` starts both containers
- [ ] `pnpm dev:ps` shows 2 running containers
- [ ] Can connect to Postgres (port 5432)
- [ ] Can connect to Redis (port 6379)
- [ ] `docker exec -it stocks-redis redis-cli ping` returns PONG

---

## 📊 What's Running Now

After successful installation:

```
┌─────────────────────────────────────┐
│  Docker Containers (Local)          │
├─────────────────────────────────────┤
│  ✅ stocks-postgres (5432)          │
│     - Database: stocks               │
│     - User: stocks                   │
│     - Password: stocks               │
│     - Volume: postgres_data          │
│                                      │
│  ✅ stocks-redis (6379)              │
│     - Persistence: AOF enabled       │
│     - Volume: redis_data             │
└─────────────────────────────────────┘
```

---

## 🎬 Next Step: Baby Step 3

Once all acceptance criteria are met, we'll create the **Prisma schema** with:
- 6 core tables (portfolios, positions, universe, sectors, pipelines, jobs)
- Migrations
- Database seeding

**Ready?** Say: *"Start Baby Step 3"*

---

**Status**: 🔵 Baby Step 2 Ready  
**Last Updated**: Dec 23, 2025

