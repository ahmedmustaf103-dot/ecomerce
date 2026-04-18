# NovaStore

E-commerce storefront built with **React + Vite** on the client and a small **Node.js (Express)** API backed by **SQLite** (via **Prisma**). Cart, wishlist, and other session-style state stay in the browser; **catalog, accounts, and orders** persist in the database file.

## Live Demo

- [Live site](https://your-demo-url-here)

## Screenshots

Add screenshots to show:

- Home page with trending products
- Product listing with filters
- Product details (reviews + related carousel)
- Cart, saved-for-later, and checkout flow
- FAQ and Contact pages

## Key Features

### Client (React)

- **Routing** with `react-router-dom`: Home, Products, Product Details, Cart, Account, Orders, FAQ, Contact
- **Product data** loaded from the API (`/api/products`) via `ProductsContext`
- **Discovery**: category + price filters, trending on home, related products carousel (snap scroll + arrows)
- **Shopping**: cart CRUD, wishlist, save for later, free-shipping progress, cart drawer
- **Product detail**: ratings, badges, variants UI, reviews section
- **Persistence (browser)**: cart, wishlist, saved items; **JWT** stored in `localStorage` after register/login
- **UX**: responsive layout, skeletons, toasts with icons
- **SEO**: meta tags, Open Graph, JSON-LD in `index.html`

### Server (Express)

- `GET /api/health` — health check
- `GET /api/products` — product catalog (SQLite; seeded from `data/products.json` on first run if empty)
- `GET /api/products/:id` — single product
- `POST /api/auth/register` — create account (email + password); returns JWT + user
- `POST /api/auth/login` — sign in; returns JWT + user
- `GET /api/auth/me` — optional `Authorization: Bearer <token>`; returns current user or `null`
- `GET /api/orders` — **requires auth**; lists the signed-in user’s orders
- `POST /api/orders` — **requires auth**; create order (checkout); order includes `userId`

In **production**, the same server can serve the Vite build from `dist/` and host the API on one origin.

## Tech Stack

- React, React Router, Vite
- Express, CORS
- CSS (custom)
- localStorage (cart / wishlist / saved / JWT)
- bcrypt + jsonwebtoken (password hashing and sessions)

## Quick Start (development)

The UI runs on **Vite** (usually `http://localhost:5173`). The API runs on **port `3001`**. Vite **proxies** `/api` to the API, so both must be running.

### Option A — one command (recommended)

```bash
npm install
cp .env.example .env   # defines DATABASE_URL for SQLite (and optional JWT_SECRET)
npm run dev:full
```

`npm run dev:api` runs **`prisma db push`** first so the schema and SQLite file stay up to date, then starts the API. Then open **`http://localhost:5173`** in your browser (not port 3001).

### Option B — two terminals

**Terminal 1 — API**

```bash
npm run dev:api
```

**Terminal 2 — frontend**

```bash
npm run dev
```

Open **`http://localhost:5173`** (check the terminal if Vite picks another port).

Optional: copy `.env.example` to `.env` and set `VITE_API_URL` only if you serve the client and API on different origins. For production, set **`JWT_SECRET`** on the server (a long random string). A dev default is used if unset.

## Production build (single server)

```bash
npm run build
npm run start
```

Then open `http://localhost:3001` (API + static SPA). Data lives in the SQLite file (default **`prisma/dev.db`**, gitignored).

## Scripts

| Script        | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm run dev` | Vite dev server (proxies `/api` → `:3001`)     |
| `npm run dev:api` | `prisma db push` then Express API on port `3001` |
| `postinstall` | `prisma generate` (client for deploys / CI) |
| `npm run build` | Production client bundle to `dist/`          |
| `npm run preview` | Preview the client build (API not included) |
| `npm run start` | `prisma db push` then serve `dist/` + API (`NODE_ENV=production`) |

## Project Structure

```text
prisma/
  schema.prisma          # User, Product, Order, OrderItem models
  dev.db                 # SQLite file (created by Prisma; gitignored)
data/
  products.json          # Seed source for products (first API start if DB empty)
server/
  index.js               # Express app
  prisma.js              # Prisma client singleton
  seedProducts.js        # Seeds Product table from data/products.json
src/
  api/client.js          # API base URL, JWT storage, authenticated fetch
  context/
    ProductsContext.jsx  # Fetch + provide products
  pages/                 # Route screens
  App.jsx
  ...
```

## Authentication: how the app knows who you are

NovaStore uses **JWT bearer tokens** (no cookies in this demo).

**1. Sign-in / register**  
`POST /api/auth/login` and `POST /api/auth/register` check email + password against the database (passwords stored as **bcrypt** hashes). On success the server returns a **JWT** signed with `JWT_SECRET` and a small **user** object `{ id, email }`.

**2. Browser (client identity)**  
The SPA saves the JWT in **`localStorage`** under `novastore-auth-token` (`src/api/client.js`). That token is the only thing the browser sends to prove identity on later requests.

**3. Restoring the session after refresh**  
On load, `App.jsx` reads the token and calls **`GET /api/auth/me`** with header `Authorization: Bearer <token>`. The API verifies the JWT and responds with `{ user: { id, email } }` or `{ user: null }` if there is no/invalid token. React keeps that as **`user` state** so the UI knows who is signed in.

**4. Server (API identity)**  
For protected routes, middleware reads `Authorization`, verifies the JWT (`server/authLib.js`), and exposes **`userId`** (and email) from the payload. Endpoints like **`GET /api/orders`** and **`POST /api/orders`** use that **`userId`** so each user only sees and creates their own orders.

**5. Authenticated requests**  
`apiFetch()` and order fetches attach **`authHeaders()`** so every protected call includes `Authorization: Bearer <token>`.

```text
Register/Login → JWT + user returned → token in localStorage
     ↓
Page load → GET /api/auth/me (Bearer) → user in React state
     ↓
Orders / checkout → same Bearer header → server uses userId from JWT
```

## Notes

- **Payments**: not integrated; checkout creates a **persisted order** on the server (demo).
- **Contact**: form opens the user’s mail client via `mailto:` (no email API).
- **Auth**: see **Authentication** above; use the **Account** page to register or sign in.
- **Orders**: fetched when signed in; each order is tied to the account that placed it.
- **Legacy JSON**: if `server/data/users.json` or `orders.json` still exist from an older setup, the API imports missing rows into SQLite on startup (skips duplicates).

## Portfolio Talking Points

- Split **catalog** (database + API; JSON seed for first run) from **session UI state** (localStorage).
- One **React context** for product loading/error to avoid duplicate fetches.
- **Express** serves REST endpoints and, in production, the built SPA for a single deploy story.

## Next Improvements

- Tests (Vitest + React Testing Library)
- Stricter validation on `POST /api/orders` and optional rate limiting
- Payment provider integration
- Swap SQLite for PostgreSQL if you need multiple app servers or managed hosting
