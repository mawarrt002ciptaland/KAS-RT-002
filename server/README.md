# Neon API

The Vite app is static, so it cannot read Neon directly without exposing the database password. This small Node server keeps `DATABASE_URL` private, provides `/api/sync` and transaction write endpoints, and serves the built app from `dist/`.

## Login and roles

* Login and logout use a signed `HttpOnly` session cookie; there is no demo mode or browser-stored password/session token.
* Admin, ketua, bendahara, and pengurus accounts are provisioned by an existing administrator in **Pengaturan → Akun**. Public signup never accepts a staff role.
* The resident signup form accepts email, password, NIK, and No. KK. The server verifies the NIK + No. KK pair against one active `Warga` row, links the account to that `wargaId`, and always takes the name from the verified RT record. NIK/KK are never stored in the browser session.
* If the Neon User table already contains the repository seed accounts, the original sample credentials are `admin@rt002mawar.id` / `admin123`, `ketua@rt002mawar.id` / `ketua123`, `bendahara@rt002mawar.id` / `bendahara123`, `sekretaris@rt002mawar.id` / `sekret123`, `keamanan@rt002mawar.id` / `aman123`, and `warga@rt002mawar.id` / `warga123`. These are development-only seed credentials; change them immediately after the first administrator login. The server upgrades the old SHA-256 password hashes to scrypt after successful login.

## Local setup

1. The screenshot provided identifies Neon project `super-mud-36780075` and branch `production` (`br-aged-surf-b3co4w8c`). In Neon Console, select this project and branch, then click the green **Connect** button. Choose database `neondb`, select **Pooled connection**, reveal/copy the connection string, and keep it private.
2. Copy `.env.example` to `.env`; put the connection string in `DATABASE_URL` and set `AUTH_SECRET` to a long random secret, for example `openssl rand -base64 48`. Never ship either value in a `VITE_*` variable.
3. Make sure the Prisma tables `Transaksi`, `Tagihan`, `Warga`, `AnggotaKK`, and `Kwitansi` exist in that same database and branch.
4. Run the UI and API in separate terminals:

```sh
npm run dev
node --env-file=.env server/index.mjs
```

The development UI connects to `http://localhost:8787` by default. User authentication uses an HTTP-only signed session cookie. If the API server is hosted separately, enter its HTTPS URL on the login page (or in **Pengaturan → Database (Neon) → Alamat API backend**) and set `CORS_ORIGIN` on that server to the frontend's exact origin.

## Static-site dashboard sync (no custom API server)

For dashboard reads only, enable **Postgres database → Data API** on the same `production` branch and `neondb` database. The dashboard uses Neon Data API's built-in `anonymous` role and makes no writes. Run `sql/neon_dashboard_api.sql` in SQL Editor, leave broad schema access disabled, then add the deployed website origin to Data API CORS settings. Copy the Data API URL (the HTTPS URL whose hostname contains `.apirest.`) into **Pengaturan → Database (Neon)** and press **Simpan URL Neon**. This mode reads only four curated dashboard views; transaction create/delete still require the Node API server above.

## Production

```sh
npm run build
node --env-file=.env server/index.mjs
```

Deploy the server and `dist/` together. Keep both `DATABASE_URL` and `AUTH_SECRET` in the hosting provider's server-side environment settings. The built browser bundle only uses `/api/*` and never contains either server secret.

## Check connection

Open `/api/health` on the running server. A successful response includes `{ "ok": true, "database": "..." }`. The app also shows its current Neon sync status in the dashboard greeting.