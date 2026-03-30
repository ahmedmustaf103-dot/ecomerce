# NovaStore Frontend

A modern e-commerce frontend built with React + Vite.  
This project is intentionally frontend-only (no backend yet), focused on strong UI/UX, state management, and portfolio-ready architecture.

## Live Demo

Add your deployed URL here after publishing:

- [Live site](https://your-demo-url-here)

## Screenshots

Add screenshots here:

- Home page
- Product listing with filters
- Product details
- Cart and checkout flow

## Features

- Multi-page app with React Router:
  - Home
  - Product listing
  - Product details
  - Cart
  - Account (demo sign in/out)
  - Orders
  - FAQ
  - Contact
- Product discovery:
  - Category and price filtering
  - Trending products on home
  - Related products carousel with arrows + snap scrolling
- Product experience:
  - Ratings, badges, review cards
  - Variant selectors (color/size UI)
  - Stock and savings display
- Cart system:
  - Add/remove/update quantity
  - Save for later
  - Free shipping progress indicator
  - Cart drawer summary
- Persistence with `localStorage`:
  - Cart
  - Wishlist
  - Saved for later
  - Demo auth status
  - Order history
- UX polish:
  - Responsive layout for mobile and desktop
  - Toast notifications with action icons
  - Skeleton loading states
  - Modern visual styling and micro-interactions
- SEO/social basics:
  - Meta description
  - Open Graph tags
  - JSON-LD store schema

## Tech Stack

- React
- React Router
- Vite
- Plain CSS (custom responsive styling)
- localStorage for client persistence

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Project Structure

```text
src/
  data/
    products.json
  pages/
    HomePage.jsx
    ProductListingPage.jsx
    ProductDetailsPage.jsx
    CartPage.jsx
    AccountPage.jsx
    OrdersPage.jsx
    FaqPage.jsx
    ContactPage.jsx
  App.jsx
  App.css
  main.jsx
  index.css
```

## Demo Notes

- This is a frontend-only demo project.
- Contact form opens the user's mail app via `mailto:`.
- Checkout is simulated and creates local order history; no real payment processing.

## What I Learned

- Building scalable React state flows without backend APIs
- Designing realistic e-commerce UX with strong frontend-only constraints
- Handling route-based architecture and reusable UI systems
- Persisting and restoring application state with localStorage
- Improving perceived performance with skeleton loading and micro-interactions

## Improvements I Would Add Next

- Unit/integration tests (Vitest + React Testing Library)
- Better accessibility audits (focus management, keyboard navigation checks)
- Product image optimization and lazy loading improvements
- Real backend integration (auth, orders, payment, inventory) when ready

## Why This Project Is Strong for Junior Frontend Roles

- Shows practical React skills beyond toy examples
- Demonstrates product thinking (conversion, UX details, responsive behavior)
- Includes architecture decisions, not just component styling
- Proves ability to polish and ship a complete frontend experience

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
