# Alpha Sigma Strategies — Setup & Implementation Reference

## Project Overview

A React/TypeScript/Vite SPA with a gold/navy theme. This document covers the full-stack implementation that added a Node.js/Express backend with MySQL, JWT-based per-member authentication, live Yahoo Finance pricing, and a forced password change on first login.

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | Node.js + Express |
| Database | MySQL (local instance) |
| Auth | JWT stored in localStorage |
| Live Prices | `yahoo-finance2` npm package (unofficial, free, no API key required) |

---

## What Was Built

### Backend (`server/` directory)

```
server/
  package.json              # CJS module, all backend deps
  .env                      # DB credentials + JWT_SECRET (never commit)
  index.js                  # Express app entry point, CORS, route mounting
  db.js                     # mysql2/promise connection pool
  middleware/
    auth.js                 # JWT verification middleware, attaches req.user
  routes/
    auth.js                 # POST /api/auth/login + POST /api/auth/change-password
    members.js              # GET /api/members (public)
    holdings.js             # GET/POST/DELETE /api/holdings
  services/
    yahooFinance.js         # getQuote(ticker) with 60-second in-memory cache
  scripts/
    schema.sql              # Run once to create DB + tables
    seed.js                 # Inserts 6 users with bcrypt-hashed passwords
```

### Frontend changes (in `ASS_lovable_code/remix-of-alphasigmastrategies-main/`)

**Files deleted:**
- `src/integrations/supabase/` (entire folder — Supabase removed)
- `src/components/Portfolio.tsx` (old unused component)
- `src/components/StockTracker.tsx` (replaced by backend data)

**Files created:**
- `src/contexts/AuthContext.tsx` — provides `{ user, token, login, logout, changePassword }`, rehydrates from localStorage; `user` includes `mustChangePassword` flag
- `src/components/LoginModal.tsx` — shadcn Dialog with email/password fields
- `src/components/AddHoldingModal.tsx` — shadcn Dialog + react-hook-form + zod; fields: ticker, type, position, purchase_price
- `src/components/ChangePasswordModal.tsx` — non-dismissible shadcn Dialog, forces password change on first login
- `.env` (frontend root) — `VITE_API_URL=http://localhost:3001`

**Files modified:**
- `src/App.tsx` — wrapped with `<AuthProvider>`
- `src/pages/Index.tsx` — login trigger/logout in nav; opens `ChangePasswordModal` automatically when `user.mustChangePassword` is true
- `src/components/Portfolios.tsx` — full rewrite with member cards + live holdings
- `vite.config.ts` — added `/api` proxy to `http://localhost:3001`
- `package.json` — uninstalled `@supabase/supabase-js` and `financialmodelingprep`

---

## One-Time Setup

### 1. MySQL Schema

Open MySQL Workbench (or CLI) and run `server/scripts/schema.sql`:

```sql
CREATE DATABASE IF NOT EXISTS alphasigma;
USE alphasigma;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  force_password_change TINYINT(1) NOT NULL DEFAULT 1
);

-- If the DB already exists (tables were created before this column was added), run:
-- ALTER TABLE users ADD COLUMN force_password_change TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS holdings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('stock', 'etf') NOT NULL,
  position ENUM('long', 'short') NOT NULL,
  purchase_price DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2. Backend `.env`

Create `server/.env` (never commit this file):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=alphasigma
JWT_SECRET=some_long_random_secret_string
PORT=3001
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

Dependencies: `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `yahoo-finance2`, `cors`, `dotenv`, `nodemon` (dev)

### 4. Seed the database

```bash
cd server
npm run seed
```

This inserts 6 users with bcrypt-hashed passwords and `force_password_change = 1`. Verify with:

```sql
USE alphasigma;
SELECT id, name, email, force_password_change FROM users;
```

### 5. Frontend `.env`

Create `.env` in `ASS_lovable_code/remix-of-alphasigmastrategies-main/`:

```
VITE_API_URL=http://localhost:3001
```

### 6. Install frontend dependencies (if not already done)

```bash
cd ASS_lovable_code/remix-of-alphasigmastrategies-main
npm install
```

---

## Running the Project

Both processes must be running simultaneously in separate terminals.

### Terminal 1 — Backend

```bash
cd C:\Users\conno\OneDrive\Documents\AlphaSigma_website\server
npm run dev
# Starts on http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd C:\Users\conno\OneDrive\Documents\AlphaSigma_website\ASS_lovable_code\remix-of-alphasigmastrategies-main
npm run dev
# Starts on http://localhost:8080 (or similar)
```

The Vite proxy in `vite.config.ts` forwards any `/api/*` requests from the frontend dev server to `http://localhost:3001`, so CORS is not an issue in development.

---

## API Endpoint Reference

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| `POST` | `/api/auth/login` | No | Returns JWT + user object (includes `mustChangePassword`) |
| `POST` | `/api/auth/change-password` | JWT | Verifies old password, sets new hash, clears flag, returns fresh JWT |
| `GET` | `/api/members` | No | Returns all users (id + name only) |
| `GET` | `/api/holdings/:userId` | No | Returns holdings with live Yahoo Finance prices |
| `POST` | `/api/holdings` | JWT | Add a holding to the authenticated user's portfolio |
| `DELETE` | `/api/holdings/:holdingId` | JWT | Delete a holding (only owner may delete) |

### Request / Response Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"connor@alphasigma.com","password":"TempPass123!"}'
# Response: { "token": "eyJ...", "user": { "id": 1, "name": "Connor ...", "mustChangePassword": true } }
```

**Change password:**
```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"oldPassword":"TempPass123!","newPassword":"MyNewPass99!"}'
# Response: { "token": "eyJ...", "user": { ..., "mustChangePassword": false } }
```

**Get holdings (with live prices):**
```bash
curl http://localhost:3001/api/holdings/1
# Response: [ { "ticker": "AAPL", "currentPrice": 195.42, "dailyPct": 1.23, "totalPct": -4.5, ... } ]
```

**Add holding (JWT required):**
```bash
curl -X POST http://localhost:3001/api/holdings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ticker":"AAPL","type":"stock","position":"long","purchase_price":200.00}'
```

**Delete holding:**
```bash
curl -X DELETE http://localhost:3001/api/holdings/5 \
  -H "Authorization: Bearer <token>"
# 200 if own holding, 403 if not owner
```

### Holdings response fields

Stored in DB: `ticker`, `name`, `type`, `position`, `purchase_price`
Computed on request via Yahoo Finance: `currentPrice`, `closingPrice`, `dailyPct`, `totalPct`

---

## Key Implementation Notes

- **`server/package.json`**: Uses `"type": "commonjs"` (not `"module"`)
- **Yahoo Finance (ESM-only package)**: v2.14+ ships ESM-only. Use a dynamic `import()` inside an async function from CJS — `const mod = await import('yahoo-finance2'); const yf = mod.default;`. A static `require('yahoo-finance2')` will throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **dotenv path**: `require('dotenv').config({ path: require('path').join(__dirname, '.env') })` — use `__dirname` so the server can be started from any working directory, not just `server/`.
- **In-memory cache**: Each ticker's Yahoo response is cached for 60 seconds in a `Map` to avoid rate limiting when multiple cards fetch simultaneously
- **DECIMAL from mysql2**: Returns as string — always `parseFloat()` before sending to client
- **DELETE security**: Backend verifies `holdings.user_id === req.user.userId` before deleting (403 if mismatch)
- **POST ticker validation**: If Yahoo returns `currentPrice: null`, request is rejected with 400 "Ticker not found"
- **Password hashing**: `bcrypt.hash(password, 12)` — cost factor 12 used throughout
- **Force password change**: `force_password_change` DB column defaults to `1`. Cleared to `0` by `POST /api/auth/change-password`. Frontend detects `mustChangePassword: true` in the login response and opens a non-dismissible modal.

---

## Member Credentials

All members are seeded with the temporary password below. Each member is prompted to change it on first login via the `ChangePasswordModal`.

| Name | Email | Password |
|------|-------|----------|
| Connor Brodbeck | connor@alphasigma.com | `TempPass123!` |
| Nick Verzello | nick@alphasigma.com | `TempPass123!` |
| Josh Miller | josh@alphasigma.com | `TempPass123!` |
| Luke Kovensky | luke@alphasigma.com | `TempPass123!` |
| Cristian Devincenzo | cristian@alphasigma.com | `TempPass123!` |
| Peter Severino | peter@alphasigma.com | `TempPass123!` |

> **Note:** After a member changes their password, their `force_password_change` flag is set to `0` in the DB. To reset a member back to the temp password (e.g. for testing), run `server/scripts/seed.js` or update the row directly in Workbench.

---

## Verification Checklist

### Backend (verify before touching frontend)

- [ ] `curl -X POST http://localhost:3001/api/auth/login ...` returns a JWT with `mustChangePassword: true`
- [ ] `curl http://localhost:3001/api/members` returns 6 members
- [ ] `curl http://localhost:3001/api/holdings/1` returns `[]` (empty initially)
- [ ] POST a holding via curl with Bearer token → returns 201
- [ ] GET holdings again → returns holding with live Yahoo prices + calculated percentages
- [ ] DELETE the holding with the correct token → 200
- [ ] DELETE with a different user's token → 403

### Frontend

- [ ] Portfolios page loads with 6 member cards, showing skeletons then empty state
- [ ] Admin nav shows login trigger when logged out
- [ ] Login modal opens, successful login shows first name in nav
- [ ] Logged-in user sees Add button + delete icons only on their own card
- [ ] Add a holding → card refreshes with new row showing live price data
- [ ] Logout → Add button disappears, Admin nav resets to login trigger
- [ ] No Supabase imports remain anywhere in `src/`

### Force Password Change

- [ ] Login as any member with `TempPass123!` → ChangePasswordModal opens automatically, cannot be dismissed (click outside or Escape does nothing)
- [ ] Submit wrong current password → inline error shown, modal stays open
- [ ] Submit mismatched new passwords → client-side error, no API call made
- [ ] Submit valid old + new passwords → modal closes, new JWT stored, name still in nav
- [ ] Logout and re-login with new password → password change modal does NOT appear
- [ ] Other untouched members still get the modal on their first login

---

## Troubleshooting

**`ERR_PACKAGE_PATH_NOT_EXPORTED` for yahoo-finance2** — The installed version is ESM-only. `yahooFinance.js` uses a dynamic `import()` to handle this. Do not change it to `require()`.

**`Cannot find module 'yahoo-finance2'`** — Run `npm install` inside `server/`, not the root.

**Yahoo Finance returns null prices** — Market may be closed; `closingPrice` (previous close) should still populate. If both are null the ticker is invalid.

**CORS errors in browser** — Ensure backend is running on port 3001 and the Vite proxy is configured in `vite.config.ts`.

**JWT errors (401)** — Token may have expired (default 7d) or localStorage was cleared. Log out and log back in.

**MySQL connection refused** — Ensure MySQL service is running and `.env` credentials match your local setup.

**`Access denied for user 'root'@'localhost' (using password: NO)`** — The server can't find `.env`. Make sure `index.js` loads dotenv with `__dirname`: `require('dotenv').config({ path: require('path').join(__dirname, '.env') })`.
