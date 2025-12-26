# 🚀 Alpha Vantage Setup Guide

## 📊 What is Alpha Vantage?

Alpha Vantage is a **FREE** market data provider with excellent coverage for US stocks!

**Limits:**
- Free: 25 API calls/day
- Premium: 500+ calls/day ($50/month)

For testing/development, the free tier is perfect! ✅

---

## 🔑 Step 1: Get Your FREE API Key

1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Click "GET FREE API KEY"
4. Copy your API key (looks like: `DEMO123ABC456DEF`)

**Takes 30 seconds!** ⚡

---

## ⚙️ Step 2: Add API Key to Your Project

### Option A: Environment Variable (Recommended)

**Windows PowerShell:**
```powershell
$env:ALPHAVANTAGE_API_KEY = "YOUR_API_KEY_HERE"
```

**Windows CMD:**
```cmd
set ALPHAVANTAGE_API_KEY=YOUR_API_KEY_HERE
```

**Linux/Mac:**
```bash
export ALPHAVANTAGE_API_KEY=YOUR_API_KEY_HERE
```

### Option B: Add to `.env` File

Open or create `C:\dev\stocks\.env` and add:

```bash
# Alpha Vantage API Key
ALPHAVANTAGE_API_KEY=YOUR_API_KEY_HERE

# Preferred provider (alphavantage, stooq, or mock)
MARKET_DATA_PROVIDER=alphavantage
```

---

## 🎯 Step 3: Restart the Worker

```powershell
cd C:\dev\stocks
# Stop the worker (Ctrl+C)
# Then restart:
pnpm -C apps/worker dev
```

The worker will now use Alpha Vantage first, then fall back to Stooq if needed!

---

## ✅ Step 4: Test It!

Run the test script to fetch data for all 5 symbols:

```powershell
cd C:\dev\stocks
.\test-real-data.ps1
```

You should now see:
- ✅ **AAPL**: Real data from Alpha Vantage
- ✅ **MSFT**: Real data from Alpha Vantage
- ✅ **GOOGL**: Real data from Alpha Vantage
- ✅ **JPM**: Real data from Alpha Vantage (or Stooq)
- ✅ **JNJ**: Real data from Alpha Vantage

---

## 🔍 How to Check Which Provider is Used

Watch the worker logs when syncing:

```
[MarketService] Fetching Alpha Vantage data for AAPL...
✅ Fetched 200 bars for AAPL from Alpha Vantage
```

---

## 💡 Pro Tips

### 1. Rate Limiting
Free tier = 25 calls/day. That's about **5 stocks × 5 attempts** per day.

### 2. Provider Fallback
The system automatically tries:
1. **Alpha Vantage** (if API key is set)
2. **Stooq** (free, no key needed)
3. **Mock** (synthetic data for testing)

### 3. Manual Provider Selection
Force a specific provider via API:

```bash
# Use Alpha Vantage
POST http://localhost:3001/market/sync?provider=alphavantage

# Use Stooq
POST http://localhost:3001/market/sync?provider=stooq

# Use Mock data
POST http://localhost:3001/market/sync?provider=mock
```

---

## 🚨 Troubleshooting

### "Demo key is limited"
Get a real free API key at: https://www.alphavantage.co/support/#api-key

### "Rate limit exceeded"
You've used your 25 daily calls. Wait 24 hours or:
- Use Stooq: `?provider=stooq`
- Use Mock: `?provider=mock`
- Upgrade to premium ($50/month)

### "No data found"
- Check symbol format (use plain symbols like `AAPL`, not `AAPL.US`)
- Verify API key is set correctly
- Check worker logs for detailed error messages

---

## 🎉 Success!

Once configured, you'll have:
- ✅ Real data for **ALL 5 stocks**
- ✅ **200 days** of historical bars per stock
- ✅ **15 technical indicators** calculated for each
- ✅ **Automated trading signals**

**Total cost: $0** (free tier)! 💰

---

## 📚 Alternative: Use Mock Data for Testing

Don't want to sign up? Use our mock provider:

```powershell
# In .env or environment
MARKET_DATA_PROVIDER=mock
```

This generates **realistic synthetic data** - perfect for testing the UI and features without hitting any external APIs!

---

**Ready to get real data for all your stocks!** 🚀

