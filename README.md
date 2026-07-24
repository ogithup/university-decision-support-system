# University Decision Support System

Initial implementation scaffold for:

- YOK / YOKSIS integration layer
- PostgreSQL warehouse schema
- KPI catalog
- Executive dashboard shell
- Docker Compose runtime
- Alembic migration chain
- SQLAlchemy ORM models
- Dashboard API fetch integration

## Structure

- `apps/api`: FastAPI backend skeleton
- `apps/web`: Next.js dashboard shell
- `infrastructure/sql/init`: PostgreSQL schema and seed scripts
- `docs`: Technical and KPI documentation

## Immediate Next Steps

1. Replace YOKSIS placeholder adapter with institution-approved integration method.
2. Add real repositories/services that read KPI and dashboard data from PostgreSQL.
3. Add authentication and row-level authorization.
4. Add CI to run migrations, tests, and frontend build checks.

## Local Run

```bash
docker compose -f infrastructure/compose/docker-compose.yml up --build
```

## YOKSIS Modes

- `sample_payload`: `YOKSIS_BASE_URL` ve auth bilgisi yoksa ingestion hattı dahili sample payload ile test edilir.
- `live`: `YOKSIS_BASE_URL` ve auth bilgisi varsa servis gerçek endpoint'e istek atar.

Connectivity kontrolu:

```text
GET /api/v1/integrations/yoksis/connectivity
GET /api/v1/health/ready
```

## Mock YOKSIS

Gercek erisim bilgisi olmadan entegrasyon hattini test etmek icin mock YOKSIS endpointleri kullanilabilir:

```text
GET /api/v1/mock/yoksis/health
GET /api/v1/mock/yoksis/programs
GET /api/v1/mock/yoksis/students
GET /api/v1/mock/yoksis/staff
```

Varsayilan auth:

```text
Authorization: Bearer mock-yoksis-key
```

Detayli gereksinim ve gecis plani:

- `docs/yok-veri-erisim-ve-entegrasyon-gereksinimleri.md`
