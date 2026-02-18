const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getQuote } = require('../services/yahooFinance');

const router = express.Router();

// GET /api/holdings/search — ticker autocomplete via Yahoo Finance
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();

    const results = (data.quotes || [])
      .filter(r => ['EQUITY', 'ETF'].includes(r.quoteType))
      .map(r => ({
        symbol: r.symbol,
        name: r.longname || r.shortname || r.symbol,
        quoteType: r.quoteType,
        exchange: r.exchange,
      }))
      .slice(0, 7);

    res.json(results);
  } catch (err) {
    console.error('Ticker search error:', err.message);
    res.json([]);
  }
});

// GET /api/holdings/history?tickers=AAPL,TSLA — 1-year monthly close prices per ticker
router.get('/history', async (req, res) => {
  const tickers = (req.query.tickers || '')
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(Boolean);

  if (!tickers.length) return res.json({});

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const entries = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=1y`;
          const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const data = await response.json();

          const result = data?.chart?.result?.[0];
          if (!result) return [ticker, []];

          const timestamps = result.timestamp || [];
          const closes = result.indicators?.quote?.[0]?.close || [];

          const points = timestamps
            .map((ts, i) => {
              const d = new Date(ts * 1000);
              return {
                month: `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
                close: closes[i] ?? null,
              };
            })
            .filter(p => p.close != null);

          return [ticker, points];
        } catch {
          return [ticker, []];
        }
      })
    );

    res.json(Object.fromEntries(entries));
  } catch (err) {
    console.error('History fetch error:', err.message);
    res.json({});
  }
});

// GET /api/holdings/closed/:userId — public, returns closed positions with realized P&L
router.get('/closed/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, ticker, name, type, position, purchase_price, close_price, closed_at FROM holdings WHERE user_id = ? AND closed_at IS NOT NULL ORDER BY closed_at DESC',
      [userId]
    );

    const result = rows.map(h => {
      const purchasePrice = parseFloat(h.purchase_price);
      const closePrice    = parseFloat(h.close_price);
      const multiplier    = h.position === 'short' ? -1 : 1;
      const realized_pct  = purchasePrice !== 0
        ? parseFloat((multiplier * ((closePrice - purchasePrice) / purchasePrice) * 100).toFixed(2))
        : null;

      return {
        id: h.id,
        ticker: h.ticker,
        name: h.name,
        type: h.type,
        position: h.position,
        purchase_price: purchasePrice,
        close_price: closePrice,
        closed_at: h.closed_at,
        realized_pct,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Closed holdings fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/holdings/:userId — public, returns OPEN holdings with live Yahoo prices
router.get('/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, ticker, name, type, position, purchase_price, created_at FROM holdings WHERE user_id = ? AND closed_at IS NULL ORDER BY created_at DESC',
      [userId]
    );

    // Fetch live prices for all holdings in parallel
    const enriched = await Promise.all(
      rows.map(async (holding) => {
        const purchasePrice = parseFloat(holding.purchase_price);
        const quote = await getQuote(holding.ticker);

        if (!quote) {
          return {
            id: holding.id,
            ticker: holding.ticker,
            name: holding.name,
            type: holding.type,
            position: holding.position,
            purchase_price: purchasePrice,
            current_price: null,
            previous_close: null,
            daily_pct: null,
            total_pct: null,
            created_at: holding.created_at,
          };
        }

        const currentPrice = quote.currentPrice;
        const previousClose = quote.previousClose;

        // For short positions, gains/losses are inverted
        const multiplier = holding.position === 'short' ? -1 : 1;

        const daily_pct =
          currentPrice != null && previousClose != null && previousClose !== 0
            ? multiplier * ((currentPrice - previousClose) / previousClose) * 100
            : null;

        const total_pct =
          currentPrice != null && purchasePrice !== 0
            ? multiplier * ((currentPrice - purchasePrice) / purchasePrice) * 100
            : null;

        return {
          id: holding.id,
          ticker: holding.ticker,
          name: holding.name,
          type: holding.type,
          position: holding.position,
          purchase_price: purchasePrice,
          current_price: currentPrice,
          previous_close: previousClose,
          daily_pct: daily_pct !== null ? parseFloat(daily_pct.toFixed(2)) : null,
          total_pct: total_pct !== null ? parseFloat(total_pct.toFixed(2)) : null,
          created_at: holding.created_at,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Holdings fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/holdings — JWT required, add holding to own portfolio
router.post('/', authMiddleware, async (req, res) => {
  const { ticker, type, position, purchase_price } = req.body;
  const userId = req.user.userId;

  if (!ticker || !type || !position || purchase_price == null) {
    return res.status(400).json({ error: 'ticker, type, position, and purchase_price are required' });
  }

  if (!['stock', 'etf'].includes(type)) {
    return res.status(400).json({ error: 'type must be "stock" or "etf"' });
  }

  if (!['long', 'short'].includes(position)) {
    return res.status(400).json({ error: 'position must be "long" or "short"' });
  }

  const parsedPrice = parseFloat(purchase_price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'purchase_price must be a positive number' });
  }

  // Validate ticker via Yahoo Finance
  const quote = await getQuote(ticker.toUpperCase());
  if (!quote || quote.currentPrice == null) {
    return res.status(400).json({ error: 'Ticker not found or has no price data' });
  }

  const name = quote.shortName || ticker.toUpperCase();

  try {
    const [result] = await pool.query(
      'INSERT INTO holdings (user_id, ticker, name, type, position, purchase_price) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, ticker.toUpperCase(), name, type, position, parsedPrice]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      ticker: ticker.toUpperCase(),
      name,
      type,
      position,
      purchase_price: parsedPrice,
    });
  } catch (err) {
    console.error('Holdings insert error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/holdings/:holdingId — JWT required, only own holdings
router.delete('/:holdingId', authMiddleware, async (req, res) => {
  const holdingId = parseInt(req.params.holdingId, 10);
  if (isNaN(holdingId)) {
    return res.status(400).json({ error: 'Invalid holding ID' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM holdings WHERE id = ?',
      [holdingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    if (rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: not your holding' });
    }

    await pool.query('DELETE FROM holdings WHERE id = ?', [holdingId]);
    res.json({ message: 'Holding deleted successfully' });
  } catch (err) {
    console.error('Holdings delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/holdings/:holdingId/close — JWT required, close a position with exit price
router.patch('/:holdingId/close', authMiddleware, async (req, res) => {
  const holdingId = parseInt(req.params.holdingId, 10);
  if (isNaN(holdingId)) {
    return res.status(400).json({ error: 'Invalid holding ID' });
  }

  const parsedPrice = parseFloat(req.body.close_price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'close_price must be a positive number' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM holdings WHERE id = ? AND closed_at IS NULL',
      [holdingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Holding not found or already closed' });
    }

    if (rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: not your holding' });
    }

    await pool.query(
      'UPDATE holdings SET close_price = ?, closed_at = NOW() WHERE id = ?',
      [parsedPrice, holdingId]
    );

    res.json({ message: 'Position closed successfully' });
  } catch (err) {
    console.error('Close holding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
