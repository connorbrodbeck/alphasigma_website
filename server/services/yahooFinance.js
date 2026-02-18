// In-memory cache: ticker -> { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function getQuote(ticker) {
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) {
      console.error(`Yahoo Finance HTTP ${res.status} for ${ticker}`);
      return null;
    }

    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;

    if (!meta) {
      return null;
    }

    const data = {
      currentPrice: meta.regularMarketPrice ?? null,
      previousClose: meta.chartPreviousClose ?? null,
      shortName: meta.shortName ?? meta.longName ?? ticker,
    };

    cache.set(ticker, { data, expiresAt: now + CACHE_TTL_MS });
    return data;
  } catch (err) {
    console.error(`Yahoo Finance error for ${ticker}:`, err.message);
    return null;
  }
}

module.exports = { getQuote };
