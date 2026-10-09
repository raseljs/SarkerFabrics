# Drone Bangladesh Backend

Express + TypeScript + MongoDB backend for the Drone Bangladesh storefront and admin panel.

## Run in VS Code (Windows)

1. Install Node.js 20 LTS or newer.
2. Open a terminal in `backend`.
3. Copy `.env.example` to `.env`.
4. Put your MongoDB Atlas connection string in `MONGODB_URI`.
5. Change the JWT secrets and `ADMIN_PASSWORD` (12–256 characters with upper/lowercase, a number and a symbol).
6. Run:

```powershell
npm install
npm run seed
npm run dev
```

The API runs at `http://localhost:5000/api/v1`.

For production, set `NODE_ENV=production`, use HTTPS values for `FRONTEND_URL`
and `API_PUBLIC_URL`, use a TLS MongoDB connection, set `COOKIE_SECURE=true`
when TLS terminates outside the app, and rotate any credentials that have ever
been present in a local `.env` file or repository history.

If MongoDB is not configured, the server still starts in degraded mode so you can diagnose the frontend/API connection. Database-backed routes return a clear 503 response until MongoDB is connected.

## Important routes

- Storefront: `/api/v1/products`, `/api/v1/content/*`
- Auth: `/api/v1/auth/register`, `/login`, `/refresh`, `/me`, `/logout`
- Cart: `/api/v1/cart`
- Orders: `/api/v1/orders`; secure guest tracking: `/api/v1/orders/track/:orderNumber?phone=...`
- Pre-orders: `POST /api/v1/preorders`, customer history at `/api/v1/preorders/mine`
- Authenticity & warranty: `POST /api/v1/warranty/verify` or `GET /api/v1/warranty/verify/:serialNumber`
- Maintenance requests: `/api/v1/maintenance-requests`
- Admin: `/api/v1/admin/*`
- Uploads: `/api/v1/admin/media`

Admin CRUD covers products, categories, brands, banners, articles, reviews, stores, coupons, menus, home sections, maintenance content, combos/accessories, orders, customers, pre-orders, warranty records and reports.

## Order, stock-out and pre-order email alerts

Every newly confirmed website order sends an admin email with the live MongoDB order number, customer, items, delivery address, payment state and totals. When an order or admin inventory change moves a product from available to zero, the backend also sends a stock-out alert to `NOTIFICATION_EMAIL` (default: `dronebangladesh567@gmail.com`). Every new pre-order sends an admin email with the persisted booking/customer/payment data. Customers can use **Pre-Order** on an out-of-
stock product and submit name, email, mobile, delivery address and either a
full or configurable partial-payment plan. When stock is added again, each
active pre-order customer receives a restock email and their booking is marked
`ready`.

Email delivery supports a Resend-compatible endpoint or SMTP/Gmail. Set
`EMAIL_API_KEY` + `EMAIL_FROM` (and optionally `EMAIL_API_URL`), or set
`EMAIL_SMTP_HOST=smtp.gmail.com`, `EMAIL_SMTP_USER` and a Gmail App Password.
Without either provider configuration, alerts are only logged and no real email can leave the server; commerce transactions still complete. For Gmail SMTP, enable 2-Step Verification on the sender account, create a Google App Password, and put that App Password in `EMAIL_SMTP_PASSWORD`.

Admins can review bookings at `/admin/preorders` and manage serial/warranty
records at `/admin/warranty-records`. The public checker is
`/authenticity-checker`.
