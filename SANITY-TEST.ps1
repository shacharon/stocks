# ============================================================================
# SANITY TEST SCRIPT - Stock Analyzer Backend
# Tests all implemented features (Steps 1-8)
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  STOCK ANALYZER - SANITY TEST" -ForegroundColor Cyan
Write-Host "  Testing Baby Steps 1-8" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"
$testsPassed = 0
$testsFailed = 0

# Helper function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method GET -ErrorAction Stop
        } else {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Body $bodyJson -ContentType "application/json" -ErrorAction Stop
        }
        Write-Host "  ✅ PASS" -ForegroundColor Green
        $script:testsPassed++
        return $response
    } catch {
        Write-Host "  ❌ FAIL: $_" -ForegroundColor Red
        $script:testsFailed++
        return $null
    }
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Check Docker Services" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host "Checking Docker containers..." -ForegroundColor Yellow
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -contains "stocks-postgres") {
        Write-Host "  ✅ PostgreSQL is running" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ❌ PostgreSQL is NOT running" -ForegroundColor Red
        Write-Host "  Run: pnpm dev:up" -ForegroundColor Yellow
        $testsFailed++
    }
    
    if ($containers -contains "stocks-redis") {
        Write-Host "  ✅ Redis is running" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ❌ Redis is NOT running" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ❌ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    $testsFailed += 2
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Health Check" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$health = Test-Endpoint -Name "Worker Health Check" -Url "$baseUrl/health"
if ($health) {
    Write-Host "  Service: $($health.service)" -ForegroundColor White
    Write-Host "  Status: $($health.status)" -ForegroundColor White
    Write-Host "  Database: $($health.database)" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Universe - Add Symbols" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$symbol1 = Test-Endpoint -Name "Add AAPL" -Url "$baseUrl/universe/symbols" -Method POST -Body @{
    symbol = "AAPL"
    market = "US"
}

$symbol2 = Test-Endpoint -Name "Add MSFT" -Url "$baseUrl/universe/symbols" -Method POST -Body @{
    symbol = "MSFT"
    market = "US"
}

$symbol3 = Test-Endpoint -Name "Add GOOGL" -Url "$baseUrl/universe/symbols" -Method POST -Body @{
    symbol = "GOOGL"
    market = "US"
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 4: Universe - List & Stats" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$symbols = Test-Endpoint -Name "List all symbols" -Url "$baseUrl/universe/symbols"
if ($symbols) {
    Write-Host "  Found $($symbols.Count) symbols" -ForegroundColor White
}

$stats = Test-Endpoint -Name "Get universe stats" -Url "$baseUrl/universe/stats"
if ($stats) {
    Write-Host "  Total: $($stats.total)" -ForegroundColor White
    Write-Host "  US: $($stats.byMarket.US)" -ForegroundColor White
    Write-Host "  TASE: $($stats.byMarket.TASE)" -ForegroundColor White
    Write-Host "  Active: $($stats.active)" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 5: Universe - Update & Delete" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

if ($symbol1) {
    $updated = Test-Endpoint -Name "Deactivate AAPL" -Url "$baseUrl/universe/symbols/$($symbol1.id)" -Method PUT -Body @{
        isActive = $false
    }
}

if ($symbol3) {
    $deleted = Test-Endpoint -Name "Delete GOOGL" -Url "$baseUrl/universe/symbols/$($symbol3.id)" -Method DELETE
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 6: Universe - Bulk Import (JSON)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$bulkImport = Test-Endpoint -Name "Bulk import 5 symbols" -Url "$baseUrl/universe/import/batch" -Method POST -Body @{
    symbols = @(
        @{ symbol = "TSLA"; market = "US" },
        @{ symbol = "NVDA"; market = "US" },
        @{ symbol = "AMD"; market = "US" },
        @{ symbol = "INTC"; market = "US" },
        @{ symbol = "META"; market = "US" }
    )
}

if ($bulkImport) {
    Write-Host "  Total: $($bulkImport.total)" -ForegroundColor White
    Write-Host "  Added: $($bulkImport.added)" -ForegroundColor White
    Write-Host "  Skipped: $($bulkImport.skipped)" -ForegroundColor White
    Write-Host "  Errors: $($bulkImport.errors.Count)" -ForegroundColor White
    Write-Host "  Duration: $($bulkImport.duration)ms" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 7: Universe - CSV Import" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$csv = @"
symbol,market
NFLX,US
AMZN,US
"@

$csvImport = Test-Endpoint -Name "CSV import 2 symbols" -Url "$baseUrl/universe/import/csv" -Method POST -Body @{
    csv = $csv
}

if ($csvImport) {
    Write-Host "  Total: $($csvImport.total)" -ForegroundColor White
    Write-Host "  Added: $($csvImport.added)" -ForegroundColor White
    Write-Host "  Skipped: $($csvImport.skipped)" -ForegroundColor White
    Write-Host "  Duration: $($csvImport.duration)ms" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 8: Market Data - Sync with Mock Provider" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$syncResult = Test-Endpoint -Name "Sync market data (mock, 30 days)" -Url "$baseUrl/market/sync?lookback=30&provider=mock" -Method POST

if ($syncResult) {
    Write-Host "  Total Symbols: $($syncResult.totalSymbols)" -ForegroundColor White
    Write-Host "  Success: $($syncResult.successCount)" -ForegroundColor White
    Write-Host "  Failed: $($syncResult.failureCount)" -ForegroundColor White
    $duration = ($syncResult.completedAt - $syncResult.startedAt)
    Write-Host "  Duration: $([math]::Round(([DateTime]$syncResult.completedAt - [DateTime]$syncResult.startedAt).TotalMilliseconds))ms" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "STEP 9: Market Data - Stats" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

$marketStats = Test-Endpoint -Name "Get market data stats" -Url "$baseUrl/market/stats"

if ($marketStats) {
    Write-Host "  Total Bars: $($marketStats.totalBars)" -ForegroundColor White
    Write-Host "  Symbols with Data: $($marketStats.symbolsWithData)" -ForegroundColor White
    if ($marketStats.dateRange.earliest) {
        Write-Host "  Earliest: $($marketStats.dateRange.earliest)" -ForegroundColor White
        Write-Host "  Latest: $($marketStats.dateRange.latest)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "FINAL RESULTS" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! System is operational." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Check the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan


