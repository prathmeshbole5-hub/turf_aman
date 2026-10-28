# TURFZONE — Deployment & Production Operations Guide

TURFZONE is an enterprise-grade multi-sport turf booking platform featuring a customer website, a 5-step booking wizard with concurrency double-booking protection, and a full operational admin dashboard.

---

## 1. System Architecture

```
                       ┌─────────────────────────┐
                       │  Client Application     │
                       │  Vite + React + TS      │
                       │  Port: 5173             │
                       └────────────┬────────────┘
                                    │ /api/* reverse proxy
                                    ▼
                       ┌─────────────────────────┐
                       │  Express 5 REST API     │
                       │  Node.js + TypeScript   │
                       │  Port: 5000             │
                       └────────────┬────────────┘
                                    │ Serialized Mutex & Transactions
                                    ▼
                       ┌─────────────────────────┐
                       │  Prisma ORM Layer       │
                       │  PostgreSQL / ACID DB   │
                       │  Port: 5432             │
                       └─────────────────────────┘
```

---

## 2. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher (optional for local standalone dev mode; supported natively via Prisma)

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/turfzone_db?schema=public"

# Authentication
JWT_SECRET="your_production_super_secret_jwt_key_at_least_32_characters"
JWT_EXPIRES_IN="7d"

# Default Admin Seed Credentials
ADMIN_EMAIL="admin@turfzone.com"
ADMIN_PASSWORD="TurfZone@2026!Admin"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_live_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_live_webhook_secret"
```

---

## 4. Quick Start: Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend API Server
```bash
npm run server
```
*The Express REST API server will start on `http://localhost:5000`.*
*Healthcheck endpoint:* `http://localhost:5000/api/health`

### 3. Start the Frontend Client
In a separate terminal:
```bash
npm run dev
```
*The client application will start on `http://localhost:5173` with instant HMR and `/api` proxying.*

---

## 5. Running the Automated Test Suite

Run the 26-assertion backend verification test suite to validate authentication, authoritative pricing, critical double-booking rejection, Razorpay HMAC verification, and maintenance blocking:

```bash
node server/test/backend-test.mjs
```

---

## 6. Database Migrations (PostgreSQL & Prisma)

When connecting a live PostgreSQL database:

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init_turfzone_schema

# (Optional) Launch Prisma Studio GUI
npx prisma studio
```

---

## 7. Production Build

```bash
# Build frontend production bundle
npm run build
```
*Output bundle will be compiled into the `dist/` directory.*

To serve the production bundle using the Express server, static middleware can serve `dist/` directly from `server/src/app.ts`.

---

## 8. Concurrency & Double-Booking Protection Notes

TURFZONE enforces double-booking protection at the server layer:
- **Interval Overlap Equation**: Two bookings $[S_1, E_1)$ and $[S_2, E_2)$ conflict if and only if $S_1 < E_2 \land E_1 > S_2$.
- **Ground Mutex Locking**: All reservation attempts per ground are serialized through `withGroundLock(groundId, ...)`.
- **HTTP 409 Conflict**: Overlapping requests return HTTP 409 with the conflict interval. The frontend wizard gracefully intercepts this and displays an actionable collision alert banner.
