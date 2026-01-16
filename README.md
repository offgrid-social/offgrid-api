# OFFGRID-API

<p align="center">
  <em>Production backend service for the OFFGRID ecosystem.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/offgrid-social/offgrid-api?style=flat-square" />
  <img src="https://img.shields.io/github/languages/top/offgrid-social/offgrid-api?style=flat-square" />
  <img src="https://img.shields.io/github/languages/count/offgrid-social/offgrid-api?style=flat-square" />
  <img src="https://img.shields.io/github/license/offgrid-social/offgrid-api?style=flat-square" />
  <img src="https://img.shields.io/badge/Ecosystem-OFFGRID-black?style=flat-square" />
</p>

<p align="center">
  Built with
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql" />
</p>

---

## Overview

**offgrid-api** is the main backend service for OFFGRID.

It exposes the HTTP API used by clients and relies on:
- **offgrid-core** for shared types and contracts
- **offgrid-auth** for authentication and token verification

The service is designed to be **strict, auditable, and production-ready**.

---

## Features

- Authentication via **offgrid-auth**  
  (`Authorization: Bearer <token>`)

- Cached token verification with role-aware guards

- PostgreSQL persistence via Prisma  
  (devices, admin user shadows, migrations included)

- Consistent JSON responses and Zod validation

- Rate limiting, CORS allowlist, and security headers

- Prometheus metrics (`/metrics`)

- Health (`/health`) and readiness (`/ready`) endpoints

- OpenAPI specification (`/openapi.json`) and Swagger UI (`/docs`)

- CI-ready setup (lint, typecheck, test, build)

- Dockerfile and docker-compose included

---

## Getting started

### Requirements

- Node.js 20+
- PostgreSQL
- offgrid-auth service running (or reachable)

---

### Installation

Copy environment file and set required values:

`cp .env.example .env`

Important variables include:
- `AUTH_SERVICE_URL`
- `DATABASE_URL`

Install dependencies and prepare Prisma:

`npm install`  
`npm run prisma:generate`  
`npm run prisma:migrate`

Start development server:

`npm run dev`

Fastify logger is enabled by default.

---

## API documentation

- Swagger UI: `/docs` (requires Bearer token)
- OpenAPI JSON: `/openapi.json`

Public endpoints:
- `/status`
- `/health`

All other endpoints require:
- `Authorization: Bearer <token>`

Admin routes additionally require:
- `role=admin`

Example request:

`curl -H "Authorization: Bearer <token>" http://localhost:3000/devices`

---

## Testing

- Unit and integration tests (devices)
- Requires a reachable PostgreSQL instance at `DATABASE_URL`

Before running tests:

`npm run prisma:migrate`

Run tests:

`npm test`

---

## Docker

Build and run locally with Docker Compose (PostgreSQL + API):

`docker-compose up --build`

Build standalone image:

`docker build -t offgrid-api .`

The container:
- runs Prisma migrations on startup
- starts the compiled server via `node dist/index.js`

---

## Production notes

- Run behind a reverse proxy with TLS termination
- Forward `X-Request-Id`; service propagates request IDs in logs and responses
- Required environment variables include:
  - `AUTH_SERVICE_URL`
  - `DATABASE_URL`
  - `PORT`
  - `LOG_LEVEL`
  - `CORS_ORIGINS`
  - `RATE_LIMIT_*`
  - `AUTH_CACHE_TTL_MS`
  - `BODY_LIMIT_BYTES`
- Run `npm run prisma:migrate` during deploy
- Monitor `/health` (liveness) and `/ready` (database)
- Scrape `/metrics` with Prometheus
- Ship structured JSON logs (pino)
- Redact sensitive headers upstream
- Apply timeouts and size limits for outbound auth service calls
- Pin CORS allowlist per environment

---

## OFFGRID Ecosystem

- **offgrid-core**  
  https://github.com/offgrid-social/offgrid-core

- **offgrid-auth**  
  https://github.com/offgrid-social/offgrid-auth

- **offgrid-api**  
  https://github.com/offgrid-social/offgrid-api

- **offgrid-node**  
  https://github.com/offgrid-social/offgrid-node

- **offgrid-frontend**  
  https://github.com/offgrid-social/offgrid-frontend

- **offgrid-cli**  
  https://github.com/offgrid-social/offgrid-cli

- **offgrid-registry**  
  https://github.com/offgrid-social/offgrid-registry

- **offgrid-docs**  
  https://github.com/offgrid-social/offgrid-docs

- **offgrid-manifest**  
  https://github.com/offgrid-social/offgrid-manifest

- **offgrid-governance**  
  https://github.com/offgrid-social/offgrid-governance

---

## Privacy

OFFGRID intentionally avoids:
- analytics SDKs
- fingerprinting
- user profiling
- algorithmic ranking

If something exists, it is visible in the code.

---

## License

Licensed under **AGPL-3.0**.  
See `LICENSE` for details.

---

*Calm over clicks · Humans over metrics · Chronology over control*
