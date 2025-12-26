# Testing Guide: Baby Step 5 — Worker Bootstrap

This guide shows you how to test all features implemented in Baby Step 5.

---

## 🎯 What We're Testing

- ✅ Worker starts without errors
- ✅ Health endpoint responds correctly
- ✅ Database connection works
- ✅ Redis connection works
- ✅ BullMQ queue system works
- ✅ Configuration loaded correctly
- ✅ Hot reload works in dev mode

---

## 📋 Prerequisites

Before testing, ensure:

```bash
# 1. Docker services running
pnpm dev:ps
# Should show: stocks-postgres (healthy), stocks-redis (healthy)

# 2. Packages built
ls packages/shared/dist/index.js
ls packages/database/dist/index.js
# Both should exist

# 3. Worker running
# Should see output in terminal or check process list
```

---

## Test 1: Health Endpoint ✅

### Basic Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T21:45:55.161Z",
  "service": "worker",
  "database": "connected"
}
```

**What to Check:**
- ✅ Status code: `200 OK`
- ✅ `status` field: `"ok"`
- ✅ `service` field: `"worker"`
- ✅ `database` field: `"connected"`
- ✅ `timestamp` is recent (current time)

### PowerShell Test (Windows)

```powershell
$response = Invoke-WebRequest -Uri http://localhost:3001/health
Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response: $($response.Content)"
```

**Expected Output:**
```
Status Code: 200
Response: {"status":"ok","timestamp":"...","service":"worker","database":"connected"}
```

### Alternative: Browser Test

Open in your browser:
```
http://localhost:3001/health
```

You should see the JSON response displayed.

---

## Test 2: Database Connection ✅

### Check Prisma Connection

The health endpoint already tests database connectivity, but you can verify in the worker logs:

```bash
# Check worker terminal output for:
[Nest] XXXXX  - LOG [PrismaService] ✅ Database connected successfully
```

### Test with Prisma Studio

```bash
pnpm db:studio
```

**Expected:**
- Opens browser at `http://localhost:5555`
- Shows all 13 tables
- Can browse data (empty tables for now)

### Direct Database Query Test

```bash
# Connect to PostgreSQL
docker exec -it stocks-postgres psql -U stocks -d stocks

# List tables
\dt

# Should see all 13 tables:
# - portfolios
# - portfolio_positions
# - symbol_universe
# - symbol_sector_map
# - market_daily_bars
# - daily_symbol_features
# - portfolio_daily_decisions
# - stop_rules_state
# - pipeline_runs
# - job_runs
# - daily_sector_lists
# - deep_dive_reports
# - daily_deltas

# Exit
\q
```

---

## Test 3: Redis Connection ✅

### Check Redis Connection

```bash
# Connect to Redis
docker exec -it stocks-redis redis-cli

# Test connection
PING
# Should return: PONG

# Check BullMQ queues (will be empty)
KEYS *
# May show: (empty list or array) - this is normal

# Exit
exit
```

### Check Worker Logs

Look for Redis/BullMQ initialization in worker logs:

```bash
[Nest] XXXXX  - LOG [InstanceLoader] BullModule dependencies initialized +2ms
```

No errors = Redis connected successfully!

---

## Test 4: BullMQ Queue System ✅

### Check Queue Processor Registration

Look in worker logs for:

```bash
[Nest] XXXXX  - LOG [InstanceLoader] QueueModule dependencies initialized +1ms
```

### Verify Test Queue Exists

The worker has a test queue processor. We can verify it's registered:

```bash
# Check Redis for queue keys
docker exec -it stocks-redis redis-cli KEYS "bull:test-queue:*"
```

Even if empty, the command should work without errors.

### Manual Queue Test (Optional Advanced)

Create a test file to add a job:

```typescript
// test-queue.ts
import { Queue } from 'bullmq';

const queue = new Queue('test-queue', {
  connection: {
    host: 'localhost',
    port: 6379,
  }
});

async function testQueue() {
  const job = await queue.add('test-job', {
    data: 'Hello from manual test',
  });
  console.log('Job added:', job.id);
}

testQueue();
```

Run with: `npx ts-node test-queue.ts` (if you have ts-node installed)

Check worker logs for job processing.

---

## Test 5: Configuration ✅

### Check Environment Variables

Look in worker logs for:

```bash
[Nest] XXXXX  - LOG [Bootstrap] 🔧 Environment: config_local
```

### Verify Configuration

The worker uses these environment variables from `.env`:

```bash
# View .env file
cat .env

# Should contain:
# DATABASE_URL="postgresql://stocks:stocks@localhost:5432/stocks?schema=public"
# REDIS_URL="redis://localhost:6379"
# PORT=3001
# NODE_ENV=development
```

### Test Different Port (Optional)

```bash
# Stop worker (Ctrl+C)

# Change port in .env
echo "PORT=3002" >> .env

# Restart worker
pnpm dev:worker

# Test new port
curl http://localhost:3002/health
```

---

## Test 6: Hot Reload ✅

### Test Auto-Rebuild on Changes

1. **Make a small change** to `apps/worker/src/health/health.controller.ts`:

```typescript
// Find the getHealth() method and modify the response:
@Get()
getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'worker',
    database: this.prismaService.isConnected() ? 'connected' : 'disconnected',
    version: '1.0.0', // ADD THIS LINE
  };
}
```

2. **Save the file**

3. **Watch the terminal** - you should see:
```bash
[23:45:10] File change detected. Starting incremental compilation...
[23:45:12] Found 0 errors. Watching for file changes.
```

4. **Test the endpoint**:
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "worker",
  "database": "connected",
  "version": "1.0.0"
}
```

5. **Revert your change** (remove the version line)

---

## Test 7: Error Handling ✅

### Test Database Disconnection

```bash
# Stop PostgreSQL
docker stop stocks-postgres

# Check health endpoint
curl http://localhost:3001/health
```

**Expected:** Should still return 200 but `database` field may show different status or throw error.

```bash
# Restart PostgreSQL
docker start stocks-postgres

# Wait 5 seconds, test again
curl http://localhost:3001/health
```

Should reconnect automatically.

### Test Redis Disconnection

```bash
# Stop Redis
docker stop stocks-redis

# Worker should show connection errors in logs
# But health endpoint should still respond

# Restart Redis
docker start stocks-redis
```

---

## Test 8: Production Build ✅

### Test Production Build

```bash
# Stop dev worker (Ctrl+C)

# Build for production
pnpm build:worker

# Run production build
cd apps/worker
node dist/main.js
```

**Expected Output:**
```bash
[Nest] XXXXX  - LOG [NestFactory] Starting Nest application...
[Nest] XXXXX  - LOG [Bootstrap] 🚀 Worker service is running on: http://localhost:3001
```

Test:
```bash
curl http://localhost:3001/health
```

Should work the same as dev mode!

```bash
# Stop (Ctrl+C)
# Return to project root
cd ../..

# Restart in dev mode
pnpm dev:worker
```

---

## Test 9: Multiple Requests ✅

### Load Test (Simple)

```bash
# Send 10 requests rapidly
for ($i = 1; $i -le 10; $i++) {
    $response = Invoke-WebRequest -Uri http://localhost:3001/health
    Write-Host "Request $i - Status: $($response.StatusCode)"
}
```

**Expected:**
- All requests return `200 OK`
- No errors in worker logs
- Response times consistent

---

## Test 10: Graceful Shutdown ✅

### Test Shutdown Behavior

1. **Start worker**: `pnpm dev:worker`

2. **Stop worker**: Press `Ctrl+C`

3. **Watch logs** - should see:
```bash
[Nest] XXXXX  - LOG [PrismaService] Disconnecting from database...
```

**What to Check:**
- ✅ No error messages
- ✅ Clean shutdown
- ✅ Database disconnected properly
- ✅ Process exits cleanly

---

## 📊 Complete Test Checklist

Run through this checklist to verify everything works:

### Infrastructure Tests
- [ ] Docker services running (`pnpm dev:ps`)
- [ ] PostgreSQL healthy (port 5432)
- [ ] Redis healthy (port 6379)

### Build Tests
- [ ] Shared package built (`ls packages/shared/dist`)
- [ ] Database package built (`ls packages/database/dist`)
- [ ] Worker built (`ls apps/worker/dist`)

### Worker Tests
- [ ] Worker starts without errors
- [ ] Health endpoint returns 200
- [ ] Database connection confirmed
- [ ] Redis connection confirmed
- [ ] BullMQ initialized
- [ ] Configuration loaded correctly

### Functionality Tests
- [ ] Health check response format correct
- [ ] Timestamp in response is current
- [ ] Can connect to Prisma Studio
- [ ] Can connect to Redis CLI
- [ ] Hot reload works
- [ ] Production build works
- [ ] Graceful shutdown works

### Advanced Tests (Optional)
- [ ] Multiple concurrent requests work
- [ ] Survives database restart
- [ ] Survives Redis restart
- [ ] Different port configuration works

---

## 🐛 Troubleshooting Test Failures

### Health Endpoint Returns 404

**Problem:** Worker not running or wrong port

**Solution:**
```bash
# Check worker is running
pnpm dev:worker

# Check correct port in .env
cat .env | grep PORT
```

### Database Shows "disconnected"

**Problem:** PostgreSQL not running

**Solution:**
```bash
pnpm dev:up
pnpm dev:ps  # Wait for healthy status
```

### Worker Won't Start

**Problem:** Packages not built

**Solution:**
```bash
pnpm build
pnpm dev:worker
```

### Hot Reload Not Working

**Problem:** Watch mode not enabled

**Solution:**
- Already enabled in `apps/worker/package.json` dev script
- Try restarting: Stop worker (Ctrl+C), then `pnpm dev:worker`

---

## 🎯 Expected Test Results Summary

After running all tests, you should have:

1. ✅ **Health Endpoint**: Returns 200 with correct JSON
2. ✅ **Database**: Connected and responding
3. ✅ **Redis**: Connected and responding
4. ✅ **BullMQ**: Initialized without errors
5. ✅ **Hot Reload**: Rebuilds on file changes
6. ✅ **Production Build**: Works correctly
7. ✅ **Graceful Shutdown**: Cleans up properly
8. ✅ **Error Recovery**: Handles service restarts

**All tests passing = Baby Step 5 is fully functional!** ✅

---

## 📝 Test Results Documentation

When testing is complete, you can document results:

```markdown
## Test Results - Baby Step 5

**Date:** [DATE]
**Tested By:** [YOUR NAME]

### Results
- Health Endpoint: ✅ PASS
- Database Connection: ✅ PASS
- Redis Connection: ✅ PASS
- BullMQ: ✅ PASS
- Hot Reload: ✅ PASS
- Production Build: ✅ PASS
- Graceful Shutdown: ✅ PASS

**Overall Status:** ✅ ALL TESTS PASSED

**Notes:**
[Any observations or issues]
```

---

**Related Documents:**
- [Step 5 Completion](./step-5-worker-bootstrap.md)
- [Build Guide](../BUILD-GUIDE.md)
- [Project Status](../PROJECT-STATUS.md)



