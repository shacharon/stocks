# Test Commands for Baby Step 7: CSV Import

## Prerequisites

1. **Start Docker Services:**
   ```powershell
   cd c:\dev\stocks
   pnpm dev:up
   ```

2. **Verify services are running:**
   ```powershell
   docker ps
   ```

3. **Worker should auto-restart and connect to database**

---

## Test 1: Batch Import (JSON)

```powershell
$body = Get-Content test-data/test-import-batch.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/universe/import/batch" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

**Expected Result:**
```json
{
  "total": 10,
  "added": 10,
  "skipped": 0,
  "errors": [],
  "duration": 150
}
```

---

## Test 2: CSV Import

```powershell
$csv = Get-Content test-data/sample-symbols.csv -Raw
$body = @{ csv = $csv } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/universe/import/csv" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

**Expected Result:**
```json
{
  "total": 10,
  "added": 0,
  "skipped": 10,
  "errors": [],
  "duration": 100
}
```
(All skipped because already added in Test 1)

---

## Test 3: CSV Import with Duplicates

```powershell
$csv = @"
symbol,market
AAPL,US
MSFT,US
GOOG,US
FB,US
"@

$body = @{ csv = $csv } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/universe/import/csv" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json
```

**Expected Result:**
```json
{
  "total": 4,
  "added": 2,
  "skipped": 2,
  "errors": [],
  "duration": 80
}
```

---

## Test 4: CSV Import with Errors

```powershell
$csv = @"
symbol,market
VALID,US
INVALID,INVALID_MARKET
,US
ANOTHER,TASE
"@

$body = @{ csv = $csv } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "http://localhost:3001/universe/import/csv" -Method POST -Body $body -ContentType "application/json"
} catch {
    Write-Host "Error (expected):" $_.Exception.Message
}
```

**Expected:** Should fail with validation error for invalid market

---

## Test 5: Verify Import Results

```powershell
# Get all symbols
Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols" | ConvertTo-Json

# Get statistics
Invoke-RestMethod -Uri "http://localhost:3001/universe/stats" | ConvertTo-Json

# Filter by market
Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols?market=US" | ConvertTo-Json
```

---

## Test 6: Large Batch Import (Performance Test)

```powershell
# Create 100 symbols
$symbols = @()
for ($i = 1; $i -le 100; $i++) {
    $symbols += @{
        symbol = "TEST$i"
        market = if ($i % 2 -eq 0) { "US" } else { "TASE" }
    }
}

$body = @{ symbols = $symbols } | ConvertTo-Json -Depth 3
$result = Invoke-RestMethod -Uri "http://localhost:3001/universe/import/batch" -Method POST -Body $body -ContentType "application/json"

Write-Host "Imported $($result.added) symbols in $($result.duration)ms"
Write-Host "Average: $([math]::Round($result.duration / $result.added, 2))ms per symbol"
```

---

## Cleanup

```powershell
# Delete all test symbols
$symbols = Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols"
foreach ($symbol in $symbols) {
    if ($symbol.symbol -like "TEST*" -or $symbol.symbol -in @("GOOG", "FB")) {
        Invoke-RestMethod -Uri "http://localhost:3001/universe/symbols/$($symbol.id)" -Method DELETE
    }
}
```


