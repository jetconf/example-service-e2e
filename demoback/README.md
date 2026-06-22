# demoback

Go backend for the Config Admin frontend.

## Stack

- **Go 1.23** — standard `net/http`, no framework
- **PostgreSQL 17** — persistent storage
- **pgx v5** — native driver with connection pool
- **Goose v3** — SQL migrations
- **caarlos0/env v11** — config from env vars

## Quick start

```bash
docker compose up --build
```

Three services start in order:
1. `postgres` — waits until healthy
2. `migrator` — applies migrations then exits
3. `server` — starts after migrator completes

The API is available at `http://localhost:8080`.

## Environment variables

| Variable       | Default     | Description                        |
|----------------|-------------|------------------------------------|
| `DB_URL`       | _(required)_| PostgreSQL DSN                     |
| `HOST`         | `0.0.0.0`   | Listen address                     |
| `PORT`         | `8080`      | Listen port                        |
| `LOG_LEVEL`    | `info`      | Log verbosity                      |

## API

All endpoints are prefixed with `/api/v1`. See [`docs/openapi.json`](docs/openapi.json) for the full spec.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login with login+password |
| POST | `/api/v1/auth/logout` | Clear session cookie |
| GET | `/api/v1/auth/me` | Get current user from session |
| GET | `/api/v1/catalog/tree?userId=` | Catalog tree with effective roles |
| GET | `/api/v1/catalog/roles?userId=` | User's role assignments |
| GET | `/api/v1/catalog/{type}/{id}?userId=` | Entity detail |
| POST | `/api/v1/catalog/{type}/{id}/config` | Create draft for config change |
| GET | `/api/v1/stats?userId=` | Dashboard stats |
| GET | `/api/v1/drafts?userId=` | List drafts visible to user |
| POST | `/api/v1/drafts/{id}/approve` | Approve draft |
| POST | `/api/v1/drafts/{id}/cancel` | Cancel draft |

## Project layout

```
cmd/
  server/    — main entry point
  migrator/  — goose migration runner
internal/
  config/    — env-based config
  handler/   — HTTP handlers + business logic
  repository/— SQL queries via pgx
migrations/
  postgres/  — goose SQL migration files
docs/
  openapi.json
```
