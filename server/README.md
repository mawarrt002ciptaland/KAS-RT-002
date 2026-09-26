# Neon API

The Vite app is static, so it cannot read Neon directly without exposing the database password. This small Node server keeps `DATABASE_URL` private, provides `/api/sync` and transaction write endpoints, and serves the built app from `dist/`.

## Local setup

1. Copy `.env.example` to `.env`; set `DATABASE_URL` from **Neon Console → Connect** and set `ADMIN_API_KEY` to a long random secret. Use the Node.js / pooled connection string.
2. Make sure the Prisma tables `Transaksi`, `Tagihan`, `Warga`, `AnggotaKK`, and `Kwitansi` exist in the same database and branch as the connection string.
3. Run the UI and API in separate terminals:

```sh
npm run dev
node --env-file=.env server/index.mjs
```

The development UI connects to `http://localhost:8787` by default. In the app, open **Pengaturan → Database (Neon)**, enter the same `ADMIN_API_KEY`, then press **Simpan Kunci Sesi** and **Sinkronkan**. The key remains in `sessionStorage` only until the browser tab closes. `CORS_ORIGIN` can be set if the UI uses another host.

## Production

```sh
npm run build
node --env-file=.env server/index.mjs
```

Deploy the server and `dist/` together. Keep both `DATABASE_URL` and `ADMIN_API_KEY` in the hosting provider's server-side environment settings. The built browser bundle only uses same-origin `/api/*` and never contains either server secret.

## Check connection

Open `/api/health` on the running server. A successful response includes `{ "ok": true, "database": "..." }`. The app also shows its current Neon sync status in the dashboard greeting.