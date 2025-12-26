# Quick Test Guide - Baby Step 13 (Change Detector)

## Prerequisites
```powershell
# Ensure services are running and data exists
pnpm dev:up
pnpm -C apps/worker dev

# You should have:
# - At least 1 portfolio with 2-3 positions
# - Market data synced for those symbols
# - Features calculated (Step 11)
```

## Quick Test Sequence

### 1. Get Portfolio ID
```powershell
$portfolios = Invoke-RestMethod -Uri "http://localhost:3001/portfolios" -Method GET
$portfolioId = $portfolios[0].id
Write-Host "Portfolio ID: $portfolioId"
```

### 2. Detect Changes for Single Symbol
```powershell
$headers = @{ "Content-Type" = "application/json" }

$body = @{
    symbol = "AAPL"
    market = "US"
    date = "2024-12-20"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3001/changes/detect" `
    -Method POST -Body $body -Headers $headers

Write-Host "Signal: $($result.signal), Confidence: $($result.confidence)%"
Write-Host "Reasons:"
$result.reasons | ForEach-Object { Write-Host "  - $_" }
```

**Expected Output**:
```
Signal: BUY, Confidence: 72%
Reasons:
  - RSI strong (>60)
  - Price above SMA20
  - Golden Cross confirmed (SMA20 > SMA50)
  - Elevated volume (1.8x avg)
  - MACD histogram positive
```

### 3. Detect Changes for Entire Portfolio
```powershell
$body = @{
    portfolioId = $portfolioId
    date = "2024-12-20"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:3001/changes/portfolio" `
    -Method POST -Body $body -Headers $headers

Write-Host "Processed: $($result.processed) positions"
Write-Host "Signals:"
$result.signals | ConvertTo-Json
```

**Expected Output**:
```
Processed: 3 positions
Signals:
{
  "BUY": 2,
  "SELL": 0,
  "HOLD": 1,
  "STRONG_BUY": 0,
  "STRONG_SELL": 0
}
```

### 4. Run Full Pipeline (Includes CHANGE_DETECTOR)
```powershell
$body = @{
    date = "2024-12-20"
    portfolioId = $portfolioId  # Optional - analyzes this portfolio only
} | ConvertTo-Json

$run = Invoke-RestMethod -Uri "http://localhost:3001/analysis/run" `
    -Method POST -Body $body -Headers $headers

Write-Host "Pipeline Run ID: $($run.pipelineRunId)"
Write-Host "Status: $($run.status)"

# Wait a moment for completion
Start-Sleep -Seconds 2

# Check CHANGE_DETECTOR job
$runId = $run.pipelineRunId
$details = Invoke-RestMethod -Uri "http://localhost:3001/analysis/runs/$runId" -Method GET
$changeJob = $details.jobs | Where-Object { $_.type -eq "CHANGE_DETECTOR" }

Write-Host "`nCHANGE_DETECTOR Job:"
Write-Host "  Status: $($changeJob.status)"
Write-Host "  Output: $($changeJob.outputData | ConvertTo-Json -Compress)"
```

**Expected**: CHANGE_DETECTOR job status = COMPLETED with signal counts.

### 5. Query Saved Decisions
```powershell
$decisions = Invoke-RestMethod -Uri "http://localhost:3001/changes/portfolio/$portfolioId/decisions/2024-12-20" -Method GET

Write-Host "`nSaved Decisions ($($decisions.count)):"
$decisions.decisions | ForEach-Object {
    Write-Host "  $($_.symbol.symbol): $($_.signal) (confidence: $($_.confidence)%) - Stop Loss: $($_.stopLoss)"
}
```

**Expected Output**:
```
Saved Decisions (3):
  AAPL: BUY (confidence: 72%) - Stop Loss: 135.45
  MSFT: HOLD (confidence: 55%) - Stop Loss: 342.67
  GOOGL: BUY (confidence: 68%) - Stop Loss: 126.90
```

### 6. Get Decision Statistics
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3001/changes/stats" -Method GET

Write-Host "`nDecision Statistics:"
Write-Host "  Total Decisions: $($stats.totalDecisions)"
Write-Host "  Date Range: $($stats.dateRange.earliest) to $($stats.dateRange.latest)"
Write-Host "  Signal Counts:"
$stats.signalCounts | ConvertTo-Json -Depth 2
```

**Expected Output**:
```
Decision Statistics:
  Total Decisions: 3
  Date Range: 2024-12-20 to 2024-12-20
  Signal Counts:
{
  "BUY": 2,
  "HOLD": 1
}
```

## Complete Test Script

Save this as `test-step-13.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3001"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "Testing Step 13: Change Detector" -ForegroundColor Green

# Get portfolio
$portfolios = Invoke-RestMethod -Uri "$baseUrl/portfolios" -Method GET
$portfolioId = $portfolios[0].id
Write-Host "`n1. Portfolio ID: $portfolioId" -ForegroundColor Cyan

# Detect single symbol
$body = @{ symbol = "AAPL"; market = "US"; date = "2024-12-20" } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "$baseUrl/changes/detect" -Method POST -Body $body -Headers $headers
Write-Host "`n2. Single Symbol: $($result.signal) @ $($result.confidence)%" -ForegroundColor Cyan

# Detect portfolio
$body = @{ portfolioId = $portfolioId; date = "2024-12-20" } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "$baseUrl/changes/portfolio" -Method POST -Body $body -Headers $headers
Write-Host "`n3. Portfolio Analysis: $($result.processed) positions" -ForegroundColor Cyan

# Run pipeline
$body = @{ date = "2024-12-20" } | ConvertTo-Json
$run = Invoke-RestMethod -Uri "$baseUrl/analysis/run" -Method POST -Body $body -Headers $headers
Write-Host "`n4. Pipeline: $($run.status)" -ForegroundColor Cyan

# Query decisions
$decisions = Invoke-RestMethod -Uri "$baseUrl/changes/portfolio/$portfolioId/decisions/2024-12-20" -Method GET
Write-Host "`n5. Saved Decisions: $($decisions.count)" -ForegroundColor Cyan

# Get stats
$stats = Invoke-RestMethod -Uri "$baseUrl/changes/stats" -Method GET
Write-Host "`n6. Total Decisions: $($stats.totalDecisions)" -ForegroundColor Cyan

Write-Host "`n✓ All Tests Passed!" -ForegroundColor Green
```

Run with:
```powershell
.\test-step-13.ps1
```

## Signal Interpretation

| Signal | Meaning | Action |
|--------|---------|--------|
| **STRONG_BUY** | High conviction buy signal | Consider adding to position |
| **BUY** | Moderate buy signal | Good entry opportunity |
| **HOLD** | No strong signal | Maintain current position |
| **SELL** | Moderate sell signal | Consider reducing position |
| **STRONG_SELL** | High conviction sell signal | Consider exiting position |

## Troubleshooting

**Issue**: No signal returned  
**Solution**: Ensure features exist for the date (run pipeline first)

**Issue**: All signals are HOLD  
**Solution**: Normal if market is neutral, check confidence scores

**Issue**: CHANGE_DETECTOR job fails  
**Solution**: Ensure portfolios have active positions

**Issue**: No decisions saved  
**Solution**: Check that portfolio has positions with valid symbols

---

**All tests passing?** ✅ Step 13 is complete!

**Next**: Proceed to Baby Step 14 (Deep Dive Reports)

