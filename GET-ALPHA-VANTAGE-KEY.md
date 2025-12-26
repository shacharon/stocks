# ⚡ Quick: Get Alpha Vantage API Key (30 seconds)

## 🔑 Step 1: Get FREE API Key

1. **Visit**: https://www.alphavantage.co/support/#api-key
2. **Enter your email**
3. **Click "GET FREE API KEY"**
4. **Copy the key** (looks like: `DEMO123ABC456DEF`)

---

## 💻 Step 2: Set Environment Variable

**Open PowerShell and run:**

```powershell
$env:ALPHAVANTAGE_API_KEY = "YOUR_KEY_HERE"
```

---

## 🚀 Step 3: Restart Worker

```powershell
cd C:\dev\stocks
# Stop worker (Ctrl+C if running)
pnpm -C apps/worker dev
```

---

## ✅ Step 4: Test It!

```powershell
.\test-real-data.ps1
```

**You should now see ALL 5 stocks with real data!** 🎉

---

## 📝 Alternative: Add to .env File

Create/edit `C:\dev\stocks\.env`:

```bash
ALPHAVANTAGE_API_KEY=YOUR_KEY_HERE
```

Then restart the worker.

---

## 🎯 What You Get

With Alpha Vantage (FREE):
- ✅ **AAPL, MSFT, GOOGL, JPM, JNJ** - All working!
- ✅ **200 days** of historical data per stock
- ✅ **15 technical indicators** calculated
- ✅ **25 API calls/day** (enough for testing)

**Total cost: $0** 💰

---

## 🔍 Quick Test (Without API Key)

Want to test first? The system will use the demo key automatically, but it's limited.

Just restart the worker and try syncing - you'll see either:
- ✅ Data fetched (demo key worked)
- ⚠️ Rate limit (need real key)

---

**Get your key now!** It takes 30 seconds: https://www.alphavantage.co/support/#api-key

