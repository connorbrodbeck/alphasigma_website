// In-memory cache: ticker -> { data, expiresAt }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Lazy-loaded ESM module reference (dynamic import works from CJS)
let _yf = null;
async function getYF() {
  if (!_yf) {
    const mod = await import('yahoo-finance2');
    _yf = mod.default;
  }
  return _yf;
}

async function getQuote(ticker) {
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const yahooFinance = await getYF();
    const quote = await yahooFinance.quote(ticker);

    const data = {
      currentPrice: quote.regularMarketPrice ?? null,
      previousClose: quote.regularMarketPreviousClose ?? null,
      shortName: quote.shortName ?? quote.longName ?? ticker,
    };

    cache.set(ticker, { data, expiresAt: now + CACHE_TTL_MS });
    return data;
  } catch (err) {
    console.error(`Yahoo Finance error for ${ticker}:`, err.message);
    return null;
  }
}

module.exports = { getQuote };
