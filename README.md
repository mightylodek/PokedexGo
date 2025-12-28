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

### Docker-First Development

**This project uses Docker for all development and deployment. All environments are identical except for environment variables.**

This ensures:
- ✅ No "works on my machine" issues
- ✅ Identical development, staging, and production environments
- ✅ Easy onboarding for new developers
- ✅ Consistent behavior across all platforms

### Prerequisites

- **Docker & Docker Compose** (required)
- Node.js is NOT required locally (runs in containers)
- PostgreSQL is NOT required locally (runs in container)

### Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables
3. Start all services: `docker-compose up -d`
4. Run database migrations: `docker-compose exec api npm run db:migrate`
5. Access services:
   - API: http://localhost:3001
   - Web: http://localhost:3000

### Development Workflow

**Project Location**: All code changes must be made in `/Users/georgebrown/Projects/PokedexGo`

All development happens inside Docker containers:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run commands in containers
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:generate

# Stop services
docker-compose down
```

### After Making Code Changes

**IMPORTANT**: This project runs in production mode with code baked into Docker images. After making ANY code changes, you MUST rebuild and restart the containers:

```bash
cd /Users/georgebrown/Projects/PokedexGo

# Rebuild all services
docker-compose build
docker-compose up -d

# Or rebuild specific service
docker-compose build api
docker-compose build web
docker-compose up -d
```

Changes to source code will NOT be reflected until containers are rebuilt.

### Environment Configuration

Environments differ only by environment variables in `.env`:
- Development: Default `.env` values
- Staging: Override with staging-specific values
- Production: Override with production-specific values

The same Docker images run in all environments.

Compatible with Unraid and other Docker-compatible platforms.

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

