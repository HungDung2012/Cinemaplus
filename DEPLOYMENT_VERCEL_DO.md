# Cinema deployment: Vercel frontend + DigitalOcean backend

This repo is best split into two deploy targets:

- `frontend/` -> Vercel
- `backend/` -> one always-on DigitalOcean host

That split matches the codebase:

- The frontend is a standalone Next.js app with proxy rewrites in `frontend/next.config.mjs`.
- The backend is a stateful Spring Boot app backed by MySQL and it also runs scheduled jobs in `backend/src/main/java/com/cinema/scheduler/BookingExpirationScheduler.java`, `backend/src/main/java/com/cinema/scheduler/MovieStatusScheduler.java`, and `backend/src/main/java/com/cinema/scheduler/VoucherCouponExpirationScheduler.java`.

Because of those schedulers, keep the backend at exactly one instance unless you move scheduled work elsewhere.

## Recommended low-cost setup

Use:

- Vercel Hobby for `frontend/`
- One DigitalOcean Droplet for `backend/` + MySQL + Caddy HTTPS

Why this is the best fit:

- Lowest monthly cost for your current architecture
- No managed database surcharge
- Supports your Spring schedulers
- Keeps Vercel focused on static assets, SSR, and frontend deployments

## Vercel frontend

Create a Vercel project that points to `frontend/` as the root directory.

Set these environment variables in Vercel:

- `BACKEND_INTERNAL_URL=https://api.your-domain.com`
- Leave `NEXT_PUBLIC_API_URL` empty unless you intentionally want the browser to call the backend directly

Notes:

- The frontend defaults to the same-origin `/api` proxy in `frontend/lib/axios.ts`.
- Report downloads now use the same normalized API base in `frontend/services/analyticsService.ts`.
- `BACKEND_INTERNAL_URL` matters at build time because rewrites are generated in `frontend/next.config.mjs`.

## DigitalOcean droplet backend

Files for the droplet deployment live in `deploy/digitalocean/docker-compose.yml`, `deploy/digitalocean/.env.example`, and `deploy/digitalocean/Caddyfile`.

High-level flow:

1. Create a small Ubuntu droplet.
2. Point `api.your-domain.com` to the droplet IP.
3. Install Docker Engine and the Compose plugin.
4. Copy this repo to the droplet.
5. In `deploy/digitalocean/`, copy `.env.example` to `.env` and fill in real secrets.
6. Run `docker compose up -d --build` from `deploy/digitalocean/`.

Required `.env` values:

- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `BACKEND_URL`
- `BACKEND_DOMAIN`
- `TMDB_API_TOKEN` if you use TMDB sync features
- Payment keys if you use VNPay, MoMo, or ZaloPay

`BACKEND_URL` is required because payment IPN callbacks are built from it in `backend/src/main/resources/application-prod.properties`.

## If you want less server management

Use:

- Vercel for `frontend/`
- DigitalOcean App Platform for `backend/`
- DigitalOcean Managed MySQL for the database

This is simpler to operate but more expensive than a single droplet because App Platform and Managed MySQL are billed separately.

## Migration checklist

1. Export your Azure MySQL data with `mysqldump`.
2. Import it into the new MySQL instance.
3. Update backend env vars first and confirm `GET /api/health` returns OK.
4. Deploy the frontend and set `BACKEND_INTERNAL_URL` to the new backend URL.
5. Update payment gateway callback allowlists and return URLs.
6. Test login, booking, and the admin analytics CSV export before switching DNS fully.
