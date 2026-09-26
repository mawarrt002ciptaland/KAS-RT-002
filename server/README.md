# Neon API

The Vite app is static, so it cannot read Neon directly without exposing the database password. This small Node server keeps `DATABASE_URL` private, provides `/api/sync` and transaction write endpoints, and serves the built app from `dist/`.

## Local setup

1. The screenshot provided identifies Neon project `super-mud-36780075` and branch `production` (`br-aged-surf-b3co4w8c`). In Neon Console, select this project and branch, then click the green **Connect** button. Choose database `neondb`, select **Pooled connection**, reveal/copy the connection string, and keep it private.
2. Copy `.env.example` to `.env`; put the connection string in `DATABASE_URL`. Set `ADMIN_API_KEY` to a long random secret, for example `openssl rand -hex 32`.
3. Make sure the Prisma tables `Transaksi`, `Tagihan`, `Warga`, `AnggotaKK`, and `Kwitansi` exist in that same database and branch.
4. Run the UI and API in separate terminals:

```sh
npm run dev
node --env-file=.env server/index.mjs
```

The development UI connects to `http://localhost:8787` by default. In the app, open **Pengaturan → Database (Neon)**, enter the same `ADMIN_API_KEY`, then press **Simpan Kunci Sesi** and **Sinkronkan**. The key remains in `sessionStorage` only until the browser tab closes. If the API server is hosted separately, enter its HTTPS URL in **Alamat API server** and set `CORS_ORIGIN` on that server to the frontend's exact origin.

## Production

```sh
npm run build
node --env-file=.env server/index.mjs
```

Deploy the server and `dist/` together. Keep both `DATABASE_URL` and `ADMIN_API_KEY` in the hosting provider's server-side environment settings. The built browser bundle only uses same-origin `/api/*` and never contains either server secret.

## Check connection

Open `/api/health` on the running server. A successful response includes `{ "ok": true, "database": "..." }`. The app also shows its current Neon sync status in the dashboard greeting.