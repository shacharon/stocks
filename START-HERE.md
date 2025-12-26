# 🚀 START HERE — Complete Installation & Verification

> **Baby Steps 1 & 2 Complete!** Follow this guide to get everything running.

---

## 📋 What's Been Created

✅ **Baby Step 1**: Monorepo workspace structure  
✅ **Baby Step 2**: Docker Compose (Postgres + Redis)

---

## ⚡ 5-Minute Setup

### Step 1: Install pnpm

```bash
npm install -g pnpm@8.15.0
```

### Step 2: Install Dependencies

```bash
cd c:\dev\stocks
pnpm install
```

### Step 3: Start Docker Services

```bash
pnpm dev:up
```

### Step 4: Verify Everything Works

```bash
# Check containers are running
pnpm dev:ps

# Test Redis connection
docker exec -it stocks-redis redis-cli ping
# Expected: PONG

# Test Postgres connection
docker exec -it stocks-postgres psql -U stocks -d stocks -c "SELECT 1;"
# Expected: Shows "1"
```

---

## ✅ Verification Checklist

Run these commands and check results:

### 1. pnpm Installed?
```bash
pnpm --version
```
**Expected**: `8.15.0` or higher

### 2. Dependencies Installed?
```bash
pnpm -r list
```
**Expected**: Lists all 4 workspace packages

### 3. Docker Running?
```bash
docker ps
```
**Expected**: Shows Docker is running

### 4. Containers Started?
```bash
pnpm dev:ps
```
**Expected**:
```
NAME              IMAGE                STATUS         PORTS
stocks-postgres   postgres:15-alpine   Up X seconds   0.0.0.0:5432->5432/tcp
stocks-redis      redis:7-alpine       Up X seconds   0.0.0.0:6379->6379/tcp
```

### 5. Postgres Accessible?
```bash
docker exec -it stocks-postgres psql -U stocks -d stocks -c "SELECT version();"
```
**Expected**: Shows PostgreSQL version

### 6. Redis Accessible?
```bash
docker exec -it stocks-redis redis-cli ping
```
**Expected**: `PONG`

---

## 🎯 All Green? You're Ready!

If all 6 checks passed, you're ready for **Baby Step 3**!

---

## 🐛 Issues? Check These

### pnpm not found?
```bash
# Install it
npm install -g pnpm@8.15.0

# Restart terminal
# Try again
pnpm --version
```

### Docker not starting?
- Open Docker Desktop
- Wait for it to fully start
- Check system tray for Docker icon
- Try `docker ps` to verify

### Port conflicts (5432 or 6379)?
```bash
# Windows: Find what's using the port
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Kill the process or change docker-compose.yml ports
```

### pnpm install fails?
```bash
# Clear cache and retry
pnpm store prune
pnpm install
```

---

## 📚 Documentation Reference

| File | Purpose |
|------|---------|
| **START-HERE.md** | This file - Quick setup |
| **INSTALL.md** | Detailed installation guide |
| **QUICK-START.md** | Fast reference |
| **BABY-STEP-2-COMPLETE.md** | What we just did |
| **PROJECT-STARTUP.md** | Complete architecture |
| **BABY-STEPS.md** | Implementation roadmap |

---

## 🎬 What's Next: Baby Step 3

Once all checks pass, we'll create the **Prisma database schema**:

**Creates**:
- `packages/database/prisma/schema.prisma`
- 6 core tables with UUID IDs
- First database migration

**Time**: 10 minutes

**To start**: Say *"Start Baby Step 3"*

---

## 📊 Current System State

```
Your Machine
├── ✅ pnpm installed
├── ✅ Project dependencies installed
├── ✅ Docker containers running
│   ├── stocks-postgres (5432)
│   └── stocks-redis (6379)
└── ⚪ Database schema (Next: Baby Step 3)
```

---

## 🔧 Useful Commands

```bash
# Docker
pnpm dev:up          # Start containers
pnpm dev:down        # Stop containers
pnpm dev:logs        # View logs
pnpm dev:ps          # Check status

# Database (after Step 3)
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run migrations
pnpm db:studio       # Open GUI

# Development (after Step 6)
pnpm dev:worker      # Start worker service
pnpm dev:web         # Start web app

# Utilities
pnpm typecheck       # Type check all packages
pnpm clean           # Clean build artifacts
```

---

## ✅ Ready for Baby Step 3?

Confirm all checks passed:
- [x] pnpm installed
- [x] Dependencies installed
- [x] Docker containers running
- [x] Postgres accessible
- [x] Redis accessible

**Say**: *"Start Baby Step 3"* to continue! 🚀

---

**Status**: ✅ Ready for Database Schema  
**Progress**: 2/10 steps (20%)  
**Last Updated**: Dec 23, 2025



