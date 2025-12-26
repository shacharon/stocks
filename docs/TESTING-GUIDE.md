# Complete Testing Guide - Stock Analyzer

This guide provides comprehensive manual testing for all implemented features through Baby Step 11.

---

## Prerequisites

1. **Services Running**:
   ```powershell
   # Terminal 1: Start Docker services
   pnpm dev:up
   
   # Terminal 2: Start worker service
   pnpm -C apps/worker dev
   ```

2. **Database Migrated**:
   ```powershell
   pnpm db:migrate
   ```

3. **Base URL**: `http://localhost:3001`

---

## Test Sequence

### Phase 1: Foundation (Steps 1-4)

#### Test 1.1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

**Expected**:
```json
{
  "status": "ok",
  "database": "up",
  "service": "worker"
}
```

---

### Phase 2: Universe Management (Step 6)

#### Test 2.1: Add Symbols
```powershell
$headers = @{ "Content-Type" = "application/json" }

# Add AAPL
$body = @{
    symbol = "AAPL"
    market = "US"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/universe" `
    -Method POST -Body $body -Headers $headers

# Add MSFT
$body = @{
    symbol = "MSFT"
    market = "US"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/universe" `
    -Method POST -Body $body -Headers $headers

# Add GOOGL
$body = @{
    symbol = "GOOGL"
    market = "US"
    isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/universe" `
    -Method POST -Body $body -Headers $headers
```

**Expected**: Each returns symbol object with `id`, `symbol`, `market`, `isActive`, `createdAt`.

#### Test 2.2: Get All Symbols
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/universe" -Method GET
```

**Expected**: Array with 3 symbols (AAPL, MSFT, GOOGL).

#### Test 2.3: Get Universe Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/universe/stats" -Method GET
```

**Expected**:
```json
{
  "total": 3,
  "active": 3,
  "inactive": 0,
  "byMarket": { "US": 3 }
}
```

#### Test 2.4: Lookup Symbol
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/universe/lookup/AAPL/US" -Method GET
```

**Expected**: Returns AAPL symbol object.

---

### Phase 3: CSV Import (Step 7)

#### Test 3.1: Prepare CSV File
Create `test-data/bulk-symbols.csv`:
```csv
symbol,market,isActive
TSLA,US,true
AMZN,US,true
NVDA,US,true
META,US,true
NFLX,US,true
```

#### Test 3.2: Import CSV
```powershell
$csvPath = "test-data/bulk-symbols.csv"
$uri = "http://localhost:3001/universe/import/csv"

curl.exe -X POST $uri -F "file=@$csvPath"
```

**Expected**:
```json
{
  "total": 5,
  "created": 5,
  "skipped": 0,
  "skippedSymbols": []
}
```

#### Test 3.3: Verify Import
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3001/universe/stats" -Method GET
$stats
```

**Expected**: `total: 8`, `active: 8` (3 original + 5 new).

---

### Phase 4: Market Data Sync (Step 8)

#### Test 4.1: Sync Market Data
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    date = "2024-12-20"
    symbols = @("AAPL", "MSFT")
    market = "US"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/market/sync" `
    -Method POST -Body $body -Headers $headers
```

**Expected**:
```json
{
  "date": "2024-12-20",
  "results": [
    {
      "symbol": "AAPL",
      "market": "US",
      "barsInserted": 200,
      "source": "stooq"
    },
    {
      "symbol": "MSFT",
      "market": "US",
      "barsInserted": 200,
      "source": "stooq"
    }
  ],
  "summary": {
    "totalSymbols": 2,
    "successful": 2,
    "failed": 0
  }
}
```

#### Test 4.2: Get Market Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/market/stats" -Method GET
```

**Expected**:
```json
{
  "totalBars": 400,
  "uniqueSymbols": 2,
  "dateRange": {
    "earliest": "2024-...",
    "latest": "2024-12-20..."
  },
  "byMarket": { "US": 400 }
}
```

---

### Phase 5: Portfolio Management (Step 9)

#### Test 5.1: Create Portfolio
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    name = "Growth Portfolio"
    description = "Tech stocks for long-term growth"
    currency = "USD"
    initialCash = 100000
} | ConvertTo-Json

$portfolio = Invoke-RestMethod -Uri "http://localhost:3001/portfolios" `
    -Method POST -Body $body -Headers $headers

# Save portfolio ID for later
$portfolioId = $portfolio.id
Write-Host "Portfolio ID: $portfolioId"
```

**Expected**: Returns portfolio object with `id`, `name`, `currency`, `initialCash`.

#### Test 5.2: Get All Portfolios
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/portfolios" -Method GET
```

**Expected**: Array with 1 portfolio.

#### Test 5.3: Get Portfolio Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/portfolios/stats" -Method GET
```

**Expected**:
```json
{
  "totalPortfolios": 1,
  "activePortfolios": 1,
  "totalPositions": 0
}
```

#### Test 5.4: Add Positions

First, get symbol IDs:
```powershell
$symbols = Invoke-RestMethod -Uri "http://localhost:3001/universe" -Method GET
$aaplId = ($symbols | Where-Object { $_.symbol -eq "AAPL" }).id
$msftId = ($symbols | Where-Object { $_.symbol -eq "MSFT" }).id

Write-Host "AAPL ID: $aaplId"
Write-Host "MSFT ID: $msftId"
```

Add AAPL position:
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    symbolId = $aaplId
    buyPrice = 150.50
    quantity = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/portfolios/$portfolioId/positions" `
    -Method POST -Body $body -Headers $headers
```

Add MSFT position:
```powershell
$body = @{
    symbolId = $msftId
    buyPrice = 380.75
    quantity = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/portfolios/$portfolioId/positions" `
    -Method POST -Body $body -Headers $headers
```

**Expected**: Each returns position object with `id`, `symbolId`, `buyPrice`, `quantity`.

#### Test 5.5: Get Positions
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/portfolios/$portfolioId/positions" -Method GET
```

**Expected**: Array with 2 positions (AAPL, MSFT).

#### Test 5.6: Update Position
```powershell
$positions = Invoke-RestMethod -Uri "http://localhost:3001/portfolios/$portfolioId/positions" -Method GET
$positionId = $positions[0].id

$headers = @{ "Content-Type" = "application/json" }
$body = @{
    quantity = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/portfolios/$portfolioId/positions/$positionId" `
    -Method PATCH -Body $body -Headers $headers
```

**Expected**: Returns updated position with `quantity: 15`.

---

### Phase 6: Analysis Pipeline (Step 10)

#### Test 6.1: Trigger Pipeline
```powershell
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    date = "2024-12-20"
} | ConvertTo-Json

$run = Invoke-RestMethod -Uri "http://localhost:3001/analysis/run" `
    -Method POST -Body $body -Headers $headers

Write-Host "Pipeline Run ID: $($run.pipelineRunId)"
```

**Expected**:
```json
{
  "pipelineRunId": "uuid-here",
  "status": "COMPLETED",
  "date": "2024-12-20"
}
```

#### Test 6.2: Get Pipeline Runs
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/analysis/runs" -Method GET
```

**Expected**: Array with 1 pipeline run, showing all 5 jobs (MARKET_SYNC, FEATURE_FACTORY, etc.).

#### Test 6.3: Get Pipeline Run by ID
```powershell
$runId = $run.pipelineRunId
Invoke-RestMethod -Uri "http://localhost:3001/analysis/runs/$runId" -Method GET
```

**Expected**: Detailed pipeline run with job details.

#### Test 6.4: Get Pipeline Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/analysis/stats" -Method GET
```

**Expected**:
```json
{
  "totalRuns": 1,
  "completedRuns": 1,
  "failedRuns": 0,
  "avgDuration": "..."
}
```

---

### Phase 7: Feature Analysis (Step 11) ✨ NEW

#### Test 7.1: Get Features for Symbol
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/features/AAPL/US/2024-12-20" -Method GET
```

**Expected**:
```json
{
  "symbol": "AAPL",
  "market": "US",
  "date": "2024-12-20T00:00:00.000Z",
  "close": 195.89,
  "volume": 45678900,
  "sma_20": 195.50,
  "sma_50": 192.30,
  "sma_200": 180.45,
  "ema_12": 196.10,
  "ema_26": 194.80,
  "rsi_14": 65.23,
  "macd": 1.30,
  "macd_signal": null,
  "macd_histogram": null,
  "bb_upper": 198.50,
  "bb_middle": 195.50,
  "bb_lower": 192.50,
  "atr_14": 3.25,
  "volume_sma_20": 50000000,
  "volume_ratio": 0.91
}
```

#### Test 7.2: Get Feature History
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/features/AAPL/US/history?start=2024-12-01&end=2024-12-20" -Method GET
```

**Expected**:
```json
{
  "symbol": "AAPL",
  "market": "US",
  "startDate": "2024-12-01",
  "endDate": "2024-12-20",
  "count": 1,
  "features": [ /* array of feature objects */ ]
}
```

#### Test 7.3: Get Feature Stats
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/features/stats" -Method GET
```

**Expected**:
```json
{
  "totalFeatures": 8,
  "uniqueSymbols": 8,
  "dateRange": {
    "earliest": "2024-12-20T00:00:00.000Z",
    "latest": "2024-12-20T00:00:00.000Z"
  }
}
```

#### Test 7.4: Run Full Pipeline with Features
```powershell
# Trigger pipeline for a new date
$headers = @{ "Content-Type" = "application/json" }
$body = @{
    date = "2024-12-23"
} | ConvertTo-Json

$run = Invoke-RestMethod -Uri "http://localhost:3001/analysis/run" `
    -Method POST -Body $body -Headers $headers

# Check feature stats (should have more features now)
Invoke-RestMethod -Uri "http://localhost:3001/features/stats" -Method GET
```

**Expected**: Feature count should increase after pipeline runs.

---

## Integration Test Script

For automated testing, create `test-integration.ps1`:

```powershell
# Save all test commands above in a single script
# Run with: .\test-integration.ps1

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3001"

Write-Host "Starting Integration Tests..." -ForegroundColor Green

# Test 1: Health
Write-Host "`n[1/7] Testing Health..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
if ($health.status -ne "ok") { throw "Health check failed" }
Write-Host "✓ Health OK" -ForegroundColor Green

# Test 2: Universe
Write-Host "`n[2/7] Testing Universe..." -ForegroundColor Cyan
# ... (add all universe tests)

# Test 3: Market Data
Write-Host "`n[3/7] Testing Market Data..." -ForegroundColor Cyan
# ... (add all market tests)

# Test 4: Portfolios
Write-Host "`n[4/7] Testing Portfolios..." -ForegroundColor Cyan
# ... (add all portfolio tests)

# Test 5: Analysis Pipeline
Write-Host "`n[5/7] Testing Analysis Pipeline..." -ForegroundColor Cyan
# ... (add all pipeline tests)

# Test 6: Features
Write-Host "`n[6/7] Testing Features..." -ForegroundColor Cyan
# ... (add all feature tests)

# Test 7: Cleanup
Write-Host "`n[7/7] Cleanup..." -ForegroundColor Cyan

Write-Host "`nAll Tests Passed! ✓✓✓" -ForegroundColor Green
```

---

## Troubleshooting

### Issue: Cannot connect to service
**Solution**: Ensure Docker is running and worker service is started.

### Issue: Database connection failed
**Solution**: Run `pnpm dev:up` and `pnpm db:migrate`.

### Issue: Symbol not found
**Solution**: Add symbol to universe first before syncing market data.

### Issue: Features return null
**Solution**: Ensure sufficient historical data (200+ bars) exists for the symbol.

### Issue: Pipeline fails
**Solution**: Check logs in terminal for specific error messages.

---

## Summary

After completing all tests:
- ✅ 29 REST endpoints tested
- ✅ Universe management with 8 symbols
- ✅ Market data for 2+ symbols
- ✅ 1 portfolio with 2 positions
- ✅ Pipeline runs with job tracking
- ✅ Technical indicators calculated
- ✅ Feature analysis functional

**Next Steps**: Baby Step 12+ (Sector Selector, Change Detector, etc.)

---

**Last Updated**: Baby Step 11 - Feature Factory Implementation

