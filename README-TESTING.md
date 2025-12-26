# 🧪 Testing Guide - Stock Analyzer Backend

## Prerequisites

### 1. Start Docker Services

```powershell
cd c:\dev\stocks
pnpm dev:up
```

**Verify Docker is running:**
```powershell
docker ps
```

You should see:
- `stocks-postgres` (PostgreSQL 15)
- `stocks-redis` (Redis 7)

### 2. Worker Auto-Starts

The worker will automatically restart and connect once Docker services are up.

**Verify worker is running:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

---

## 🚀 Quick Sanity Test

Run the automated sanity test script:

```powershell
.\SANITY-TEST.ps1
```

This will test:
- ✅ Docker services
- ✅ Worker health
- ✅ Universe CRUD
- ✅ Bulk import (JSON)
- ✅ CSV import
- ✅ Market data sync
- ✅ Market stats

---

## 📋 Manual Testing

### Test 1: Health Check

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" | ConvertTo-Json
```

**Expected:**
```json
{
  "status": "ok",
  "service": "worker",
  "database": "up"
}
```

---

### Test 2: Add Symbols

```powershell
# Add AAPL
$body = @{ symbol = "AAPL"; market = "US" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols" -Method POST -Body $body -ContentType "application/json"

# Add MSFT
$body = @{ symbol = "MSFT"; market = "US" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols" -Method POST -Body $body -ContentType "application/json"
```

---

### Test 3: List Symbols

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols" | ConvertTo-Json
```

---

### Test 4: Get Stats

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/universe/stats" | ConvertTo-Json
```

---

### Test 5: Bulk Import

```powershell
$body = @{
  symbols = @(
    @{ symbol = "GOOGL"; market = "US" },
    @{ symbol = "AMZN"; market = "US" },
    @{ symbol = "TSLA"; market = "US" }
  )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3001/universe/import/batch" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

---

### Test 6: CSV Import

```powershell
$csv = @"
symbol,market
NVDA,US
AMD,US
INTC,US
"@

$body = @{ csv = $csv } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/universe/import/csv" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

---

### Test 7: Sync Market Data (Mock)

```powershell
# Sync last 30 days with mock provider
Invoke-RestMethod -Uri "http://localhost:3001/market/sync?lookback=30&provider=mock" -Method POST | ConvertTo-Json
```

---

### Test 8: Market Data Stats

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/market/stats" | ConvertTo-Json
```

---

### Test 9: Sync Real Data (Stooq)

```powershell
# Sync last 30 days with Stooq (real data)
Invoke-RestMethod -Uri "http://localhost:3001/market/sync?lookback=30&provider=stooq" -Method POST | ConvertTo-Json
```

**Note:** This fetches real data from Stooq.com. May be slower.

---

## 🔍 Troubleshooting

### Worker Not Starting

**Symptom:** `Invoke-RestMethod: Unable to connect`

**Solution:**
1. Check Docker is running: `docker ps`
2. Check worker terminal for errors
3. Restart worker: `pnpm -C apps/worker dev`

---

### Database Connection Error

**Symptom:** `Can't reach database server at localhost:5432`

**Solution:**
1. Start Docker: `pnpm dev:up`
2. Verify PostgreSQL is running: `docker ps | Select-String postgres`
3. Check logs: `pnpm dev:logs`

---

### Redis Connection Error

**Symptom:** `connect ECONNREFUSED ::1:6379`

**Solution:**
1. Start Docker: `pnpm dev:up`
2. Verify Redis is running: `docker ps | Select-String redis`

---

## 📊 Expected Results

After running all tests, you should have:

- **Symbols:** 8-10 symbols in universe
- **Market Data:** ~150-200 bars (8 symbols × 21 trading days)
- **All Tests:** Passing ✅

---

## 🎯 What's Tested

### ✅ Implemented (Steps 1-8)
- Monorepo structure
- Docker services
- Database schema
- Worker service
- Health endpoint
- Universe CRUD
- Bulk import (JSON)
- CSV import
- Market data providers (Mock, Stooq)
- Market data sync
- Market stats

### ⏳ Not Yet Implemented
- Portfolio CRUD
- Position management
- Analysis engine
- Sector selection
- Deep dive reports

---

## 📚 Additional Resources

- **[SANITY-TEST.ps1](SANITY-TEST.ps1)** - Automated test script
- **[test-data/TEST-COMMANDS.md](test-data/TEST-COMMANDS.md)** - More test examples
- **[docs/baby-steps/](docs/baby-steps/)** - Step-by-step documentation

---

**Happy Testing!** 🚀

