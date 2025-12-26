#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Comprehensive Integration Test Suite for Stock Analyzer Worker Service

.DESCRIPTION
    Tests all 29+ REST endpoints across 7 feature modules:
    - Health & System
    - Universe Management
    - Market Data
    - Portfolio Management
    - Analysis Pipeline
    - Feature Analysis
    
    Prerequisites:
    - Docker services running (pnpm dev:up)
    - Worker service running (pnpm -C apps/worker dev)
    - Database migrated (pnpm db:migrate)

.EXAMPLE
    .\test-integration.ps1
#>

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3001"
$headers = @{ "Content-Type" = "application/json" }

# Colors for output
$green = "Green"
$red = "Red"
$cyan = "Cyan"
$yellow = "Yellow"

# Test counters
$testsPassed = 0
$testsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null,
        [scriptblock]$Validator
    )
    
    try {
        Write-Host "  Testing: $Name" -ForegroundColor $cyan
        
        if ($Body) {
            $bodyJson = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $Uri -Method $Method -Body $bodyJson -Headers $headers
        } else {
            $response = Invoke-RestMethod -Uri $Uri -Method $Method
        }
        
        if ($Validator) {
            $validationResult = & $Validator $response
            if ($validationResult -eq $false) {
                throw "Validation failed"
            }
        }
        
        Write-Host "    ✓ PASSED" -ForegroundColor $green
        $script:testsPassed++
        return $response
    }
    catch {
        Write-Host "    ✗ FAILED: $($_.Exception.Message)" -ForegroundColor $red
        $script:testsFailed++
        return $null
    }
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n================================================" -ForegroundColor $yellow
    Write-Host "  $Title" -ForegroundColor $yellow
    Write-Host "================================================`n" -ForegroundColor $yellow
}

# Start Tests
Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor $green
Write-Host "║  Stock Analyzer - Integration Test Suite           ║" -ForegroundColor $green
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor $green

# ============================================================
# Phase 1: Health Check
# ============================================================
Write-Section "Phase 1: Health & System (1 test)"

Test-Endpoint `
    -Name "Health Check" `
    -Method GET `
    -Uri "$baseUrl/health" `
    -Validator { param($r) $r.status -eq "ok" -and $r.database -eq "up" }

# ============================================================
# Phase 2: Universe Management
# ============================================================
Write-Section "Phase 2: Universe Management (8 tests)"

# Add symbols
$symbols = @(
    @{ symbol = "AAPL"; market = "US"; isActive = $true },
    @{ symbol = "MSFT"; market = "US"; isActive = $true },
    @{ symbol = "GOOGL"; market = "US"; isActive = $true }
)

$symbolIds = @{}
foreach ($sym in $symbols) {
    $result = Test-Endpoint `
        -Name "Add Symbol: $($sym.symbol)" `
        -Method POST `
        -Uri "$baseUrl/universe" `
        -Body $sym `
        -Validator { param($r) $r.symbol -eq $sym.symbol }
    
    if ($result) {
        $symbolIds[$sym.symbol] = $result.id
    }
}

# Get all symbols
Test-Endpoint `
    -Name "Get All Symbols" `
    -Method GET `
    -Uri "$baseUrl/universe" `
    -Validator { param($r) $r.Count -ge 3 }

# Get stats
Test-Endpoint `
    -Name "Get Universe Stats" `
    -Method GET `
    -Uri "$baseUrl/universe/stats" `
    -Validator { param($r) $r.total -ge 3 }

# Lookup symbol
Test-Endpoint `
    -Name "Lookup Symbol (AAPL)" `
    -Method GET `
    -Uri "$baseUrl/universe/lookup/AAPL/US" `
    -Validator { param($r) $r.symbol -eq "AAPL" }

# Batch import
$batchData = @{
    symbols = @(
        @{ symbol = "TSLA"; market = "US"; isActive = $true },
        @{ symbol = "AMZN"; market = "US"; isActive = $true }
    )
}

Test-Endpoint `
    -Name "Batch Import Symbols" `
    -Method POST `
    -Uri "$baseUrl/universe/import/batch" `
    -Body $batchData `
    -Validator { param($r) $r.created -eq 2 }

# Verify updated stats
Test-Endpoint `
    -Name "Verify Updated Stats" `
    -Method GET `
    -Uri "$baseUrl/universe/stats" `
    -Validator { param($r) $r.total -ge 5 }

# ============================================================
# Phase 3: Market Data
# ============================================================
Write-Section "Phase 3: Market Data Sync (2 tests)"

$syncRequest = @{
    date = "2024-12-20"
    symbols = @("AAPL", "MSFT")
    market = "US"
}

Test-Endpoint `
    -Name "Sync Market Data (AAPL, MSFT)" `
    -Method POST `
    -Uri "$baseUrl/market/sync" `
    -Body $syncRequest `
    -Validator { param($r) $r.summary.successful -ge 1 }

Start-Sleep -Seconds 2  # Allow time for sync

Test-Endpoint `
    -Name "Get Market Stats" `
    -Method GET `
    -Uri "$baseUrl/market/stats" `
    -Validator { param($r) $r.totalBars -gt 0 }

# ============================================================
# Phase 4: Portfolio Management
# ============================================================
Write-Section "Phase 4: Portfolio Management (8 tests)"

# Create portfolio
$portfolioData = @{
    name = "Test Growth Portfolio"
    description = "Integration test portfolio"
    currency = "USD"
    initialCash = 100000.00
}

$portfolio = Test-Endpoint `
    -Name "Create Portfolio" `
    -Method POST `
    -Uri "$baseUrl/portfolios" `
    -Body $portfolioData `
    -Validator { param($r) $r.name -eq "Test Growth Portfolio" }

$portfolioId = $portfolio.id

# Get all portfolios
Test-Endpoint `
    -Name "Get All Portfolios" `
    -Method GET `
    -Uri "$baseUrl/portfolios" `
    -Validator { param($r) $r.Count -ge 1 }

# Get portfolio stats
Test-Endpoint `
    -Name "Get Portfolio Stats" `
    -Method GET `
    -Uri "$baseUrl/portfolios/stats" `
    -Validator { param($r) $r.totalPortfolios -ge 1 }

# Add positions (using saved symbol IDs)
$aaplId = $symbolIds["AAPL"]
$msftId = $symbolIds["MSFT"]

if ($aaplId) {
    $positionData = @{
        symbolId = $aaplId
        buyPrice = 150.50
        quantity = 10
    }
    
    $position1 = Test-Endpoint `
        -Name "Add Position (AAPL)" `
        -Method POST `
        -Uri "$baseUrl/portfolios/$portfolioId/positions" `
        -Body $positionData `
        -Validator { param($r) $r.quantity -eq 10 }
}

if ($msftId) {
    $positionData = @{
        symbolId = $msftId
        buyPrice = 380.75
        quantity = 5
    }
    
    Test-Endpoint `
        -Name "Add Position (MSFT)" `
        -Method POST `
        -Uri "$baseUrl/portfolios/$portfolioId/positions" `
        -Body $positionData `
        -Validator { param($r) $r.quantity -eq 5 }
}

# Get positions
$positions = Test-Endpoint `
    -Name "Get Positions" `
    -Method GET `
    -Uri "$baseUrl/portfolios/$portfolioId/positions" `
    -Validator { param($r) $r.Count -ge 1 }

# Update position (if we have one)
if ($positions -and $positions.Count -gt 0) {
    $positionId = $positions[0].id
    $updateData = @{ quantity = 15 }
    
    Test-Endpoint `
        -Name "Update Position" `
        -Method PATCH `
        -Uri "$baseUrl/portfolios/$portfolioId/positions/$positionId" `
        -Body $updateData `
        -Validator { param($r) $r.quantity -eq 15 }
}

# Get updated portfolio stats
Test-Endpoint `
    -Name "Get Updated Portfolio Stats" `
    -Method GET `
    -Uri "$baseUrl/portfolios/stats" `
    -Validator { param($r) $r.totalPositions -ge 1 }

# ============================================================
# Phase 5: Analysis Pipeline
# ============================================================
Write-Section "Phase 5: Analysis Pipeline (4 tests)"

$pipelineRequest = @{
    date = "2024-12-20"
}

$pipelineRun = Test-Endpoint `
    -Name "Trigger Pipeline Run" `
    -Method POST `
    -Uri "$baseUrl/analysis/run" `
    -Body $pipelineRequest `
    -Validator { param($r) $r.status -eq "COMPLETED" }

$pipelineRunId = $pipelineRun.pipelineRunId

# Get all runs
Test-Endpoint `
    -Name "Get All Pipeline Runs" `
    -Method GET `
    -Uri "$baseUrl/analysis/runs" `
    -Validator { param($r) $r.Count -ge 1 }

# Get specific run
if ($pipelineRunId) {
    Test-Endpoint `
        -Name "Get Pipeline Run by ID" `
        -Method GET `
        -Uri "$baseUrl/analysis/runs/$pipelineRunId" `
        -Validator { param($r) $r.id -eq $pipelineRunId }
}

# Get pipeline stats
Test-Endpoint `
    -Name "Get Pipeline Stats" `
    -Method GET `
    -Uri "$baseUrl/analysis/stats" `
    -Validator { param($r) $r.totalRuns -ge 1 }

# ============================================================
# Phase 6: Feature Analysis (NEW in Step 11)
# ============================================================
Write-Section "Phase 6: Feature Analysis (3 tests)"

Start-Sleep -Seconds 2  # Allow time for feature calculation

# Get features for AAPL
Test-Endpoint `
    -Name "Get Features for AAPL (2024-12-20)" `
    -Method GET `
    -Uri "$baseUrl/features/AAPL/US/2024-12-20" `
    -Validator { param($r) $r.symbol -eq "AAPL" -and $null -ne $r.close }

# Get feature history
Test-Endpoint `
    -Name "Get Feature History (AAPL)" `
    -Method GET `
    -Uri "$baseUrl/features/AAPL/US/history?start=2024-12-01&end=2024-12-31" `
    -Validator { param($r) $r.symbol -eq "AAPL" }

# Get feature stats
Test-Endpoint `
    -Name "Get Feature Stats" `
    -Method GET `
    -Uri "$baseUrl/features/stats" `
    -Validator { param($r) $r.totalFeatures -ge 0 }

# ============================================================
# Phase 7: Idempotency Test
# ============================================================
Write-Section "Phase 7: Idempotency (1 test)"

# Try running the same pipeline again - should return alreadyRan
$idempotencyTest = Test-Endpoint `
    -Name "Pipeline Idempotency Check" `
    -Method POST `
    -Uri "$baseUrl/analysis/run" `
    -Body $pipelineRequest `
    -Validator { param($r) $r.alreadyRan -eq $true }

# ============================================================
# Summary
# ============================================================
Write-Host "`n╔══════════════════════════════════════════════════════╗" -ForegroundColor $green
Write-Host "║  TEST SUMMARY                                        ║" -ForegroundColor $green
Write-Host "╚══════════════════════════════════════════════════════╝`n" -ForegroundColor $green

$totalTests = $testsPassed + $testsFailed
Write-Host "Total Tests:  $totalTests" -ForegroundColor $cyan
Write-Host "Passed:       $testsPassed" -ForegroundColor $green
Write-Host "Failed:       $testsFailed" -ForegroundColor $(if ($testsFailed -eq 0) { $green } else { $red })

if ($testsFailed -eq 0) {
    Write-Host "`n✓✓✓ ALL TESTS PASSED ✓✓✓`n" -ForegroundColor $green
    exit 0
} else {
    Write-Host "`n✗✗✗ SOME TESTS FAILED ✗✗✗`n" -ForegroundColor $red
    exit 1
}

