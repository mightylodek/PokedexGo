# Pokémon GO Data Platform

A data-first MVP for Pokémon GO content with a modular battle engine.

## Architecture

- **Catalog**: Static, canonical Pokémon data (species, forms, moves, types)
- **Battle Engine**: Pure, deterministic battle logic (no database, no HTTP)
- **API**: NestJS REST API that orchestrates battles using catalog data
- **Web**: Next.js admin UI for CRUD operations

## Key Principle

**Pokémon data is static, canonical, and normalized. Battle mechanics are dynamic, versioned, and modular.**

Battle logic consumes Pokémon data — never owns it.

## Tech Stack

- **Backend**: Node.js + TypeScript, NestJS, Prisma, PostgreSQL
- **Frontend**: Next.js (App Router), Tailwind CSS
- **Infrastructure**: Docker, docker-compose

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Start services: `docker-compose up -d`
4. Run migrations: `npm run db:migrate`
5. Start dev servers: `npm run dev`

### Docker Deployment

```bash
docker-compose up -d
```

Compatible with Unraid.

## Project Structure

```
/
├── apps/
│   ├── api/          # NestJS API
│   └── web/          # Next.js Web App
├── packages/
│   ├── shared/       # DTOs, enums, schemas
│   └── battle-engine/ # Pure battle logic
└── docker/
```

## Module Separation

1. **Catalog**: Pokémon species, forms, moves, types (ingest-driven)
2. **Battle Engine**: Damage calculation, energy, shields, turn resolution (pure functions)
3. **Battle Runtime**: Turn sequencing, action validation, battle logs

## License

MIT

