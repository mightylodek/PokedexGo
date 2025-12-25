# Quick Start Guide

## Prerequisites

- Node.js >= 18
- PostgreSQL (or use Docker)
- npm or yarn

## Step 1: Install Dependencies

```bash
# From project root
npm install
```

## Step 2: Set Up Environment

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pokedexgo?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Ingestion
GAME_MASTER_MIRROR_URL="https://raw.githubusercontent.com/pokemongo-dev-contrib/pokemongo-game-master/master/versions/latest/V2_GAME_MASTER.json"
```

## Step 3: Set Up Database

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name pokedexgo-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pokedexgo \
  -p 5432:5432 \
  -d postgres:15-alpine

# Wait a few seconds for PostgreSQL to start
```

### Option B: Using Local PostgreSQL

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE pokedexgo;
```

## Step 4: Generate Prisma Client and Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

## Step 5: Start the Servers

### Option A: Start Both Servers (Recommended)

Open two terminal windows:

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
```

The API will start on `http://localhost:3001`

**Terminal 2 - Web Server:**
```bash
cd apps/web
npm run dev
```

The web app will start on `http://localhost:3000`

### Option B: Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
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
# Check if PostgreSQL is running
docker ps  # If using Docker
# or
psql -U postgres -h localhost -d pokedexgo  # If using local PostgreSQL

# Test connection
psql "postgresql://postgres:postgres@localhost:5432/pokedexgo"
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
cd apps/api
npx prisma generate
```

### Migration Issues

```bash
# Reset database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev --name init
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

