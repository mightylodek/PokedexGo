# Setup Guide

## Docker-First Development

**This project uses Docker for all development work. All environments are identical except for environment variables.**

This approach ensures:
- ✅ No local Node.js or PostgreSQL installation required
- ✅ Identical development, staging, and production environments
- ✅ Easy onboarding - just install Docker
- ✅ No "works on my machine" issues
- ✅ Consistent behavior across macOS, Linux, and Windows

## Prerequisites

- **Docker & Docker Compose** (required - that's it!)
- Node.js is NOT required (runs in Docker containers)
- PostgreSQL is NOT required (runs in Docker container)

## Docker Setup for macOS

### Installing Docker Desktop

1. **Download Docker Desktop for Mac**
   - Visit https://www.docker.com/products/docker-desktop/
   - Choose the version for your Mac (Apple Silicon or Intel)
   - The installer will automatically detect your Mac type

2. **Install Docker Desktop**
   - Open the downloaded `.dmg` file
   - Drag Docker to your Applications folder
   - Launch Docker Desktop from Applications
   - Follow the setup wizard (you may need to enter your password)

3. **Verify Installation**
   ```bash
   docker --version
   docker compose version
   ```

### Docker Desktop Configuration for Development

For optimal performance when running the app inside Docker:

1. **Open Docker Desktop Settings** (click the Docker icon in the menu bar → Settings)

2. **Resources Settings** (recommended for this project):
   - **Memory**: Allocate at least 4GB (8GB if you have it available)
   - **CPUs**: Use at least 2 CPUs (more if available)
   - **Disk image size**: 60GB should be sufficient

3. **General Settings**:
   - ✅ Enable "Use Docker Compose V2" (should be enabled by default)
   - ✅ Enable "Start Docker Desktop when you log in" (optional but convenient)

4. **File Sharing**:
   - The project directory should already be shared by default
   - If you have issues with volume mounts, check Settings → Resources → File Sharing
   - Ensure your project path is listed (usually `/Users` is shared by default)

### Mac-Specific Notes

- **Apple Silicon (M1/M2/M3) Macs**: Docker Desktop automatically uses ARM64 images when available. The PostgreSQL and Node images used in this project support both Intel and Apple Silicon.
- **File Performance**: Volume mounts in Docker Desktop on Mac use a VM, so file watching may be slower than native. This is usually fine for development, but if you notice delays, you can:
  - Use Docker's named volumes instead of bind mounts (already configured for `node_modules`)
  - Or run services locally and only use Docker for PostgreSQL
- **Port Conflicts**: If ports 3000, 3001, or 5432 are already in use, you'll need to either:
  - Stop the conflicting services
  - Or modify the port mappings in `docker-compose.yml`

### Testing Docker Setup

After installing Docker Desktop, test that everything works:

```bash
# Start all services (PostgreSQL, API, and Web)
docker-compose up -d

# Check that containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Quick Start (Docker-Only)

This is the **only** way to run the application. All development happens in Docker containers.

1. **Navigate to the repository**
   ```bash
   cd PokedexGo
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration if needed
   # Note: For development, most defaults work fine
   ```

3. **Start all services** (PostgreSQL, API, and Web)
   ```bash
   docker-compose up -d
   ```
   
   This will:
   - Start PostgreSQL database container
   - Build and start the API container
   - Build and start the Web container
   - Set up proper networking between services
   - Mount source code for hot-reload development

4. **Run database migrations**
   ```bash
   docker-compose exec api npm run db:migrate
   ```

5. **Access services**
   - API: http://localhost:3001
   - Web: http://localhost:3000
   - Database: `postgres:5432` (from within containers) or `localhost:5432` (from host)
     - User: `postgres`
     - Password: `postgres`
     - Database: `pokedexgo`

6. **View logs** (to see what's happening)
   ```bash
   # All services
   docker-compose logs -f
   
   # Just API
   docker-compose logs -f api
   
   # Just Web
   docker-compose logs -f web
   ```

7. **Stop services** when done
   ```bash
   docker-compose down
   ```

## Development Workflow (All in Docker)

All development commands run inside Docker containers:

```bash
# Install dependencies (runs in container)
docker-compose exec api npm install

# Generate Prisma client
docker-compose exec api npm run db:generate

# Run migrations
docker-compose exec api npm run db:migrate

# Run Prisma Studio (database GUI)
docker-compose exec api npx prisma studio

# Run tests
docker-compose exec api npm test

# Access container shell for debugging
docker-compose exec api sh
```

**IMPORTANT**: This project runs in **production mode** with code baked into Docker images. Source code is NOT mounted as volumes. After making code changes, you must rebuild and restart containers:

```bash
cd /Users/georgebrown/Projects/PokedexGo
docker-compose build
docker-compose up -d
```

See "Rebuilding After Code Changes" section below for details.

## Project Structure

```
/
├── apps/
│   ├── api/              # NestJS API
│   │   ├── catalog/      # Pokémon data + ingestion
│   │   ├── battles/      # Battle orchestration
│   │   ├── auth/         # Authentication
│   │   └── ingestion/    # Data ingestion
│   └── web/              # Next.js Web App
├── packages/
│   ├── shared/           # DTOs, enums, schemas
│   └── battle-engine/     # Pure battle logic
└── docker/               # Dockerfiles
```

## Key Endpoints

### API (http://localhost:3001)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `GET /catalog/pokemon` - List Pokémon species
- `GET /catalog/pokemon/:id` - Get Pokémon by ID
- `GET /catalog/forms/:id` - Get form by ID
- `GET /catalog/moves` - List moves
- `GET /catalog/types` - List types
- `POST /battles/simulate` - Simulate battle
- `GET /ingestion/history` - Ingestion history (auth required)
- `POST /ingestion/run` - Run ingestion (auth required)

### Web (http://localhost:3000)

- Home page with overview
- Admin UI (to be implemented)
- Battle simulator UI (to be implemented)

## Database Management (Docker)

### Prisma Studio
```bash
docker-compose exec api npx prisma studio
```
Access at http://localhost:5555 (if port is exposed) or use port forwarding.

### Create Migration
```bash
docker-compose exec api npx prisma migrate dev --name your_migration_name
```

### Reset Database
```bash
docker-compose exec api npx prisma migrate reset
```

### Access Database Directly
```bash
# From host machine
docker-compose exec postgres psql -U postgres -d pokedexgo

# Or use connection string from host
psql "postgresql://postgres:postgres@localhost:5432/pokedexgo"
```

## Rebuilding After Code Changes

**Project Location**: All code changes must be made in `/Users/georgebrown/Projects/PokedexGo`

**IMPORTANT**: This project runs in production mode with code baked into Docker images (no volume mounts). After making ANY code changes, you MUST rebuild and restart the containers:

```bash
# Navigate to project directory
cd /Users/georgebrown/Projects/PokedexGo

# Rebuild all services
docker-compose build
docker-compose up -d

# Or rebuild specific service
docker-compose build api
docker-compose build web
docker-compose up -d
```

Code changes will NOT be reflected until containers are rebuilt.

## Building for Production

Production builds happen in Docker:

```bash
# Build production images
docker-compose build

# Or build specific service
docker-compose build api
docker-compose build web

# Start production services
docker-compose up -d
```

**Note:** The same Docker images can be used across development, staging, and production. Only environment variables differ.

## Troubleshooting

### Docker-Specific Issues

#### Docker Desktop Not Starting
- Ensure Docker Desktop is running (check menu bar for Docker icon)
- Try restarting Docker Desktop: Menu bar → Docker icon → Quit Docker Desktop, then relaunch
- On Apple Silicon Macs, ensure you're using the ARM64 version of Docker Desktop

#### Containers Won't Start
```bash
# Check Docker is running
docker ps

# View detailed error messages
docker-compose logs

# Rebuild containers from scratch
docker-compose build --no-cache
docker-compose up -d
```

#### Volume Mount Issues (File Changes Not Reflecting)
- Ensure your project directory is in Docker Desktop's file sharing list
- Settings → Resources → File Sharing → Add your project path if needed
- On Mac, Docker uses a VM for file sharing, so file watching may be slower than native

#### Out of Memory Errors
- Increase Docker Desktop memory allocation: Settings → Resources → Memory
- Recommend at least 4GB, preferably 8GB if available

### Database Connection Issues
- Ensure PostgreSQL container is running: `docker-compose ps`
- Check DATABASE_URL in .env - should use service name `postgres` not `localhost`:
  ```env
  DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pokedexgo?schema=public"
  ```
- Verify Docker network connectivity: containers should use service names (e.g., `postgres:5432`) not `localhost`
- From within containers, always use service names. From host machine, use `localhost`

### Port Conflicts
- Check if ports are already in use:
  ```bash
  # macOS
  lsof -i :3000
  lsof -i :3001
  lsof -i :5432
  ```
- Stop conflicting services or change ports in docker-compose.yml
- Update NEXT_PUBLIC_API_URL if API port changes

### Prisma Client Not Generated
```bash
docker-compose exec api npx prisma generate
```

### Module Resolution Issues
- Ensure all packages are built: `npm run build`
- Check tsconfig.json paths
- Verify workspace configuration

## Quick Start (TL;DR)

For a quick start guide with step-by-step instructions, see [QUICKSTART.md](./QUICKSTART.md).

## Next Steps

1. **Populate Catalog Data**: Run ingestion (see QUICKSTART.md)
2. **Build Admin UI**: Create CRUD interfaces
3. **Add User Pokédex**: Implement favorites and owned Pokémon
4. **Enhance Battle Simulator**: Add more sophisticated strategies
5. **Add Tests**: Unit tests for battle engine, integration tests for API

