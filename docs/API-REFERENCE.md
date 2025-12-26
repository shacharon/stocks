# Stock Analyzer - Complete API Reference

**Base URL**: `http://localhost:3001`

This document lists all 30 REST endpoints currently implemented in the Worker service.

---

## Health & System

### 1. Health Check
```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-26T10:00:00.000Z",
  "service": "worker",
  "database": "up"
}
```

---

## Universe Management (8 endpoints)

### 2. Add Symbol
```http
POST /universe
Content-Type: application/json

{
  "symbol": "AAPL",
  "market": "US",
  "isActive": true
}
```

### 3. Get All Symbols
```http
GET /universe?market=US&isActive=true&limit=100&offset=0
```

### 4. Get Symbol by ID
```http
GET /universe/:id
```

### 5. Update Symbol
```http
PATCH /universe/:id
Content-Type: application/json

{
  "isActive": false
}
```

### 6. Delete Symbol
```http
DELETE /universe/:id
```

### 7. Get Universe Stats
```http
GET /universe/stats
```

**Response**:
```json
{
  "total": 150,
  "active": 145,
  "inactive": 5,
  "byMarket": {
    "US": 100,
    "TASE": 50
  }
}
```

### 8. Lookup Symbol
```http
GET /universe/lookup/:symbol/:market
```

### 9. Batch Import Symbols
```http
POST /universe/import/batch
Content-Type: application/json

{
  "symbols": [
    { "symbol": "AAPL", "market": "US", "isActive": true },
    { "symbol": "MSFT", "market": "US", "isActive": true }
  ]
}
```

**Response**:
```json
{
  "total": 2,
  "created": 2,
  "skipped": 0,
  "skippedSymbols": []
}
```

### 10. CSV Import Symbols
```http
POST /universe/import/csv
Content-Type: multipart/form-data

file: [CSV file]
```

**CSV Format**:
```csv
symbol,market,isActive
AAPL,US,true
MSFT,US,true
```

---

## Market Data (2 endpoints)

### 11. Sync Market Data
```http
POST /market/sync
Content-Type: application/json

{
  "date": "2024-12-26",
  "symbols": ["AAPL", "MSFT"],
  "market": "US"
}
```

**Response**:
```json
{
  "date": "2024-12-26",
  "results": [
    {
      "symbol": "AAPL",
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

### 12. Get Market Stats
```http
GET /market/stats
```

**Response**:
```json
{
  "totalBars": 50000,
  "uniqueSymbols": 150,
  "dateRange": {
    "earliest": "2023-01-01T00:00:00.000Z",
    "latest": "2024-12-26T00:00:00.000Z"
  },
  "byMarket": {
    "US": 40000,
    "TASE": 10000
  }
}
```

---

## Portfolio Management (8 endpoints)

### 13. Create Portfolio
```http
POST /portfolios
Content-Type: application/json

{
  "name": "Growth Portfolio",
  "description": "Tech stocks",
  "currency": "USD",
  "initialCash": 100000
}
```

### 14. Get All Portfolios
```http
GET /portfolios?isActive=true
```

### 15. Get Portfolio by ID
```http
GET /portfolios/:id
```

### 16. Update Portfolio
```http
PATCH /portfolios/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": false
}
```

### 17. Delete Portfolio
```http
DELETE /portfolios/:id
```

### 18. Get Portfolio Stats
```http
GET /portfolios/stats
```

**Response**:
```json
{
  "totalPortfolios": 5,
  "activePortfolios": 4,
  "totalPositions": 50
}
```

### 19. Add Position
```http
POST /portfolios/:portfolioId/positions
Content-Type: application/json

{
  "symbolId": "uuid-here",
  "buyPrice": 150.50,
  "quantity": 10
}
```

### 20. Get Positions
```http
GET /portfolios/:portfolioId/positions?isActive=true
```

### 21. Update Position
```http
PATCH /portfolios/:portfolioId/positions/:positionId
Content-Type: application/json

{
  "quantity": 20
}
```

### 22. Delete Position
```http
DELETE /portfolios/:portfolioId/positions/:positionId
```

---

## Analysis Pipeline (4 endpoints)

### 23. Trigger Pipeline
```http
POST /analysis/run
Content-Type: application/json

{
  "date": "2024-12-26",
  "portfolioId": "optional-uuid"
}
```

**Response**:
```json
{
  "pipelineRunId": "uuid-here",
  "status": "COMPLETED",
  "date": "2024-12-26"
}
```

### 24. Get All Pipeline Runs
```http
GET /analysis/runs?date=2024-12-26&limit=10
```

### 25. Get Pipeline Run by ID
```http
GET /analysis/runs/:id
```

**Response**:
```json
{
  "id": "uuid",
  "runDate": "2024-12-26T00:00:00.000Z",
  "status": "COMPLETED",
  "startedAt": "2024-12-26T10:00:00.000Z",
  "completedAt": "2024-12-26T10:05:00.000Z",
  "jobs": [
    {
      "id": "uuid",
      "type": "MARKET_SYNC",
      "status": "COMPLETED"
    },
    {
      "id": "uuid",
      "type": "FEATURE_FACTORY",
      "status": "COMPLETED"
    }
  ]
}
```

### 26. Get Pipeline Stats
```http
GET /analysis/stats
```

**Response**:
```json
{
  "totalRuns": 100,
  "completedRuns": 95,
  "failedRuns": 5,
  "avgDuration": "5 minutes"
}
```

---

## Feature Analysis (3 endpoints)

### 27. Get Features for Symbol
```http
GET /features/:symbol/:market/:date
Example: GET /features/AAPL/US/2024-12-26
```

**Response**:
```json
{
  "symbol": "AAPL",
  "market": "US",
  "date": "2024-12-26T00:00:00.000Z",
  "close": 150.50,
  "volume": 5000000,
  "sma_20": 148.25,
  "sma_50": 145.80,
  "sma_200": 140.50,
  "ema_12": 149.10,
  "ema_26": 147.30,
  "rsi_14": 65.50,
  "macd": 1.80,
  "macd_signal": 1.50,
  "macd_histogram": 0.30,
  "bb_upper": 152.00,
  "bb_middle": 148.25,
  "bb_lower": 144.50,
  "atr_14": 2.50,
  "volume_sma_20": 4500000,
  "volume_ratio": 1.11
}
```

### 28. Get Feature History
```http
GET /features/:symbol/:market/history?start=2024-01-01&end=2024-12-26
Example: GET /features/AAPL/US/history?start=2024-12-01&end=2024-12-26
```

**Response**:
```json
{
  "symbol": "AAPL",
  "market": "US",
  "startDate": "2024-12-01",
  "endDate": "2024-12-26",
  "count": 20,
  "features": [
    { /* feature object */ },
    { /* feature object */ }
  ]
}
```

### 29. Get Feature Stats
```http
GET /features/stats
```

**Response**:
```json
{
  "totalFeatures": 5000,
  "uniqueSymbols": 150,
  "dateRange": {
    "earliest": "2024-01-01T00:00:00.000Z",
    "latest": "2024-12-26T00:00:00.000Z"
  }
}
```

---

## Common Response Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request body or parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## Notes

1. All dates should be in ISO 8601 format: `YYYY-MM-DD`
2. All UUIDs are version 4 UUIDs
3. Market enum values: `"US"`, `"TASE"`
4. Pipeline status values: `"PENDING"`, `"RUNNING"`, `"COMPLETED"`, `"FAILED"`
5. Job type values: `"MARKET_SYNC"`, `"FEATURE_FACTORY"`, `"SECTOR_SELECTOR"`, `"CHANGE_DETECTOR"`, `"DEEP_DIVE"`

---

**Last Updated**: Step 11 - Feature Factory Implementation


