# Quick Start Guide

## Docker-First Development

**All development happens in Docker containers. No local Node.js or PostgreSQL installation required.**

## Prerequisites

- **Docker & Docker Compose** (that's all you need!)

## Step 1: Start Docker Services

```bash
# From project root
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and start API container
- Build and start Web container
- Install all dependencies automatically

## Step 2: Set Up Environment

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
cp .env.example .env
```

**Important:** For Docker, use service names for internal connections:

```bash
# Database (use 'postgres' service name, not 'localhost')
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pokedexgo?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://api:3001"  # Internal service name

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL="http://localhost:3001"  # Public URL for browser

# Ingestion
GAME_MASTER_MIRROR_URL="https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/V2_GAME_MASTER.json"
```

**Note:** The same `.env` file works for all environments. Only the values change between dev/staging/prod.

## Step 3: Database is Already Running

The PostgreSQL database is automatically started by `docker-compose up -d`. No additional setup needed!

The database is accessible:
- From containers: `postgres:5432`
- From host machine: `localhost:5432`

## Step 4: Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client (runs in API container)
docker-compose exec api npm run db:generate

# Run database migrations (runs in API container)
docker-compose exec api npm run db:migrate
```

## Step 5: Servers Are Already Running

The servers are already running from Step 1! They started automatically with `docker-compose up -d`.

- **API**: http://localhost:3001
- **Web**: http://localhost:3000

### View Logs

```bash
# All services
docker-compose logs -f

# Just API
docker-compose logs -f api

# Just Web
docker-compose logs -f web
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api
docker-compose restart web

# Stop services
docker-compose down
```

**IMPORTANT**: This project runs in **production mode** with code baked into Docker images. After making code changes in `/Users/georgebrown/Projects/PokedexGo`, you must rebuild containers:

```bash
cd /Users/georgebrown/Projects/PokedexGo
docker-compose build
docker-compose up -d
```

## Step 6: Create a User Account (For Ingestion)

The ingestion endpoints require authentication. First, register a user:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "displayName": "Admin"
  }'
```

Then login to get an access token:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response.

## Step 7: Run Ingestion

### Option A: Using the Web UI

1. Open `http://localhost:3000` in your browser
2. Navigate to `/ingestion` page
3. Click "Run Ingestion" button
4. Wait for completion (this may take a few minutes)

**Note:** The web UI currently expects authentication. You may need to:
- Open browser DevTools → Application → Local Storage
- Add `accessToken` key with your JWT token value

### Option B: Using cURL

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login
curl -X POST http://localhost:3001/ingestion/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Option C: Using the API Directly (Temporary - Remove Auth for Testing)

If you want to test without authentication, temporarily remove the `@UseGuards(JwtAuthGuard)` from `apps/api/src/ingestion/ingestion.controller.ts`:

```typescript
@Controller('ingestion')
// @UseGuards(JwtAuthGuard)  // Comment this out temporarily
export class IngestionController {
  // ...
}
```

Then you can run:

```bash
curl -X POST http://localhost:3001/ingestion/run
```

## Step 8: View the Catalog

### Option A: Using the Web UI

1. Open `http://localhost:3000` in your browser
2. Click on "Catalog" or navigate to `/catalog`
3. View statistics and browse Pokémon

### Option B: Using the API

```bash
# Get catalog statistics
curl http://localhost:3001/catalog/stats

# Get Pokémon list
curl http://localhost:3001/catalog/pokemon?skip=0&take=20

# Get specific Pokémon
curl http://localhost:3001/catalog/pokemon/POKEMON_ID

# Get moves
curl http://localhost:3001/catalog/moves

# Get types
curl http://localhost:3001/catalog/types
```

## Step 9: Check Ingestion Status

### Using Web UI

Navigate to `/ingestion` to see:
- Current ingestion state
- Ingestion history
- Check for updates

### Using API

```bash
# Get ingestion history
curl http://localhost:3001/ingestion/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get current state
curl http://localhost:3001/ingestion/state \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Check for updates
curl http://localhost:3001/ingestion/check-updates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL container is running
docker-compose ps

# Check container logs
docker-compose logs postgres

# Test connection from host
psql "postgresql://postgres:postgres@localhost:5432/pokedexgo"

# Access database from container
docker-compose exec postgres psql -U postgres -d pokedexgo
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001
# or
netstat -an | grep 3001

# Kill the process or change the port in .env
```

### Prisma Client Not Generated

```bash
docker-compose exec api npx prisma generate
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
docker-compose exec api npx prisma migrate reset

# Or create a new migration
docker-compose exec api npx prisma migrate dev --name init
```

### Ingestion Fails

1. Check `GAME_MASTER_MIRROR_URL` in `.env`
2. Verify network connectivity
3. Check API logs for errors
4. Ensure database is accessible

### Authentication Issues

If you're having trouble with authentication in the web UI:

1. Register and login via API to get a token
2. Open browser DevTools → Application → Local Storage
3. Add `accessToken` with your JWT token
4. Refresh the page

Or temporarily disable auth guards for testing (not recommended for production).

## Next Steps

- Explore the catalog data
- Run battle simulations
- Set up automated ingestion (cron job)
- Customize the UI
- Add more Pokémon data mappings

