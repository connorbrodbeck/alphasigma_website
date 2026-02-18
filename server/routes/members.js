const express = require('express');
const pool = require('../db');

const router = express.Router();

// GET /api/members — public, returns id + name only
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('Members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
