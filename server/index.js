require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const membersRoutes = require('./routes/members');
const holdingsRoutes = require('./routes/holdings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];
if (process.env.FRONTEND_URL) corsOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/holdings', holdingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Alpha Sigma server running on http://localhost:${PORT}`);
});
