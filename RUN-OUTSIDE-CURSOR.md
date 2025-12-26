# 🚀 Running EOD Stock Analyzer Outside Cursor

This guide shows you how to run the entire application in regular terminals/command prompts.

## 📋 Prerequisites

Make sure you have:
- ✅ Docker Desktop running
- ✅ Node.js 18+ (or 20+)
- ✅ pnpm installed

---

## 🎯 Quick Start (Easiest Way)

### Option 1: Use the Startup Script

1. **Double-click** `start.bat` in the root folder
2. Wait 10-15 seconds for all services to start
3. Open browser: http://localhost:3000

**That's it!** 🎉

To stop: Double-click `stop.bat`

---

## 🛠️ Manual Start (3 Terminals)

If you prefer manual control, open 3 separate PowerShell/CMD windows:

### Terminal 1: Docker Services
```powershell
cd C:\dev\stocks
pnpm dev:up
```
**Status**: Should show PostgreSQL and Redis running  
**Keep running!**

### Terminal 2: Worker API (Backend)
```powershell
cd C:\dev\stocks
pnpm -C apps/worker dev
```
**Status**: Should show `🚀 Worker service is running on: http://localhost:3001`  
**Keep running!**

### Terminal 3: Web UI (Frontend)
```powershell
cd C:\dev\stocks
pnpm -C apps/web dev
```
**Status**: Should show `▲ Next.js 14.1.0 - Local: http://localhost:3000`  
**Keep running!**

---

## 🌐 Access Points

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | Main UI - Start here! |
| **Stocks** | http://localhost:3000/stocks | View all tracked symbols |
| **JPM Analysis** | http://localhost:3000/stocks/JPM?market=US&date=2024-12-26 | Real technical analysis |
| **Portfolios** | http://localhost:3000/portfolios | Manage portfolios |
| **Worker API** | http://localhost:3001/health | Backend health check |
| **Prisma Studio** | http://localhost:5555 | Database viewer (run `pnpm db:studio`) |

---

## 🎨 What You'll See

### Dashboard (Home)
- ✅ 5 symbols tracked
- ✅ 139 market bars from Stooq.com
- ✅ 2 active portfolios
- ✅ System status indicators

### JPM Stock Detail
**REAL DATA FROM STOOQ.COM:**
- Price: $243.14
- RSI-14: 46.45 (Neutral)
- MACD: -3.81 (Bearish)
- SMA-20: $242.06
- SMA-50: $236.83
- ATR-14: $4.36
- Volume: 4,452,168 (51% of avg)
- All 15 technical indicators!

---

## 🛑 Stopping Everything

### Option 1: Quick Stop
Double-click `stop.bat`

### Option 2: Manual Stop
1. **Terminal 1**: `Ctrl+C`, then `pnpm dev:down`
2. **Terminal 2**: `Ctrl+C`
3. **Terminal 3**: `Ctrl+C`

---

## 🔧 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

**For port 3000 (Web):**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**For port 3001 (Worker):**
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

**For Docker ports (5432, 6379):**
```powershell
docker ps
docker stop stocks-postgres stocks-redis
```

### Database Issues
Reset the database:
```powershell
cd C:\dev\stocks
pnpm db:reset
pnpm db:migrate
```

### Cache Issues
Clear Next.js cache:
```powershell
cd C:\dev\stocks\apps\web
rm -rf .next
pnpm dev
```

---

## 📊 Running the Full Test

To test with real data:

```powershell
cd C:\dev\stocks
.\test-real-data.ps1
```

This will:
1. ✅ Check worker health
2. ✅ Add 5 test stocks
3. ✅ Sync real data from Stooq.com
4. ✅ Create a portfolio
5. ✅ Run full analysis pipeline
6. ✅ Verify all features

---

## 🎯 Production Build

To build for production:

```powershell
cd C:\dev\stocks

# Build worker
pnpm -C apps/worker build

# Build web
pnpm -C apps/web build

# Start production
pnpm -C apps/worker start  # Terminal 1
pnpm -C apps/web start     # Terminal 2
```

---

## 📚 Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:up` | Start Docker containers |
| `pnpm dev:down` | Stop Docker containers |
| `pnpm db:studio` | Open Prisma Studio (database viewer) |
| `pnpm db:reset` | Reset database |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm -C apps/worker test` | Run worker tests |
| `pnpm -C apps/web lint` | Lint web code |

---

## 🎊 You're All Set!

Your professional stock analyzer is running outside Cursor!

**Happy Trading!** 📈🚀

---

## 📞 Need Help?

- Check logs in each terminal window
- Visit http://localhost:3001/health to verify backend
- Check Docker Desktop to verify containers are running
- Run `.\test-real-data.ps1` to verify end-to-end functionality

