# offgrid-api

Production-ready Fastify + TypeScript backend for offgrid with PostgreSQL + Prisma, Zod validation, structured logging, metrics, and OpenAPI docs.

## Features
- Auth via offgrid-auth (`Authorization: Bearer <token>`), cached verification with role-aware guards.
- Prisma/PostgreSQL models for devices and admin user shadows; migrations included.
- Consistent JSON responses, Zod validation, rate limiting, CORS allowlist, security headers.
- Prometheus `/metrics`, health `/health`, readiness `/ready` (DB check), OpenAPI `/openapi.json` + Swagger UI `/docs`.
- CI (lint, typecheck, test, build), Dockerfile + docker-compose.

## Getting started
1) Install Node 20+ and PostgreSQL.
2) Copy `.env.example` to `.env` and set values (notably `AUTH_SERVICE_URL` + `DATABASE_URL`).
3) Install deps and generate Prisma client:
   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate   # applies migrations to DATABASE_URL
   ```
4) Run dev server (Fastify logger enabled):
   ```bash
   npm run dev
   ```

## API docs
- Swagger UI: `/docs` (requires Bearer token). OpenAPI JSON: `/openapi.json`.
- Public endpoints: `/status`, `/health`. All others require `Authorization: Bearer <token>`; admin routes also require `role=admin`.

Example request:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/devices
```

## Tests
- Unit + integration (devices). Requires a reachable Postgres at `DATABASE_URL`.
```bash
npm run prisma:migrate   # ensure schema
npm test
```

## Docker
- Build + run locally with compose (Postgres + API):
  ```bash
  docker-compose up --build
  ```
- Standalone image: `docker build -t offgrid-api .`
  - Container command runs `npm run prisma:migrate` then `node dist/index.js` (see compose).

## Production notes
- Run behind a reverse proxy (TLS termination, HTTP/2, gzip) and forward `X-Request-Id`; service will propagate request IDs in responses and logs.
- Required env: `AUTH_SERVICE_URL`, `DATABASE_URL`, `PORT`, `LOG_LEVEL`, `CORS_ORIGINS`, `RATE_LIMIT_*`, `AUTH_CACHE_TTL_MS`, `BODY_LIMIT_BYTES`.
- Run `npm run prisma:migrate` on deploy; keep Prisma client generated for the target platform.
- Monitor `/health` (liveness) and `/ready` (DB), scrape `/metrics` for Prometheus.
- Configure log shipping for JSON logs (pino); ensure sensitive headers (`authorization`) are redacted upstream as well.
- Apply network/timeouts to outbound auth service calls and size limits via env; pin CORS allowlist per environment.
