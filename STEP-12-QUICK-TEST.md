# Quick Test Guide - Baby Step 12 (Sector Selector)

## Prerequisites
```powershell
# Ensure services are running
pnpm dev:up
pnpm -C apps/worker dev
```

## Quick Test Sequence

### 1. Get Symbol IDs
```powershell
$symbols = Invoke-RestMethod -Uri "http://localhost:3001/universe" -Method GET
$aaplId = ($symbols | Where-Object { $_.symbol -eq "AAPL" }).id
$msftId = ($symbols | Where-Object { $_.symbol -eq "MSFT" }).id
$googlId = ($symbols | Where-Object { $_.symbol -eq "GOOGL" }).id

Write-Host "AAPL ID: $aaplId"
Write-Host "MSFT ID: $msftId"
Write-Host "GOOGL ID: $googlId"
```

### 2. Assign Sectors
```powershell
$headers = @{ "Content-Type" = "application/json" }

# Assign Technology sector
@($aaplId, $msftId, $googlId) | ForEach-Object {
    $body = @{ symbolId = $_; sector = "Technology" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3001/sectors/assign" `
        -Method POST -Body $body -Headers $headers
}
```

### 3. Verify Mappings
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/sectors/mappings" -Method GET
Invoke-RestMethod -Uri "http://localhost:3001/sectors/stats" -Method GET
```

### 4. Run Pipeline (includes SECTOR_SELECTOR)
```powershell
$body = @{ date = "2024-12-20" } | ConvertTo-Json
$run = Invoke-RestMethod -Uri "http://localhost:3001/analysis/run" `
    -Method POST -Body $body -Headers $headers

Write-Host "Pipeline Run ID: $($run.pipelineRunId)"
```

### 5. Query Sector Rankings
```powershell
# Get daily sector list
Invoke-RestMethod -Uri "http://localhost:3001/sectors/daily/2024-12-20?market=US&top=5" -Method GET

# Get sector list stats
Invoke-RestMethod -Uri "http://localhost:3001/sectors/lists/stats" -Method GET
```

### 6. Calculate Strength Manually (Optional)
```powershell
$body = @{ date = "2024-12-20"; market = "US" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/sectors/strength" `
    -Method POST -Body $body -Headers $headers
```

## Expected Results

### Sector Stats
```json
{
  "totalMapped": 3,
  "uniqueSectors": 1,
  "sectorCounts": {
    "Technology": 3
  }
}
```

### Sector Strength
```json
{
  "sector": "Technology",
  "symbolCount": 3,
  "avgRsi": 65.23,
  "avgSma20Dist": 2.45,
  "avgVolRatio": 1.15,
  "strongSymbols": 2,
  "weakSymbols": 0,
  "score": 72.50
}
```

### Daily Sector List
```json
{
  "date": "2024-12-20",
  "market": "US",
  "count": 1,
  "sectors": [
    {
      "sector": "Technology",
      "rank": 1,
      "score": 72.50,
      "symbolCount": 3
    }
  ]
}
```

## Troubleshooting

**Issue**: No sectors returned  
**Solution**: Ensure symbols have sector mappings assigned

**Issue**: Score is 0 or null  
**Solution**: Ensure features exist for the date (run pipeline first)

**Issue**: SECTOR_SELECTOR job fails  
**Solution**: Check that symbol_sector_map has entries

---

**All tests passing?** ✅ Step 12 is complete!

**Next**: Proceed to Baby Step 13 (Change Detector)

