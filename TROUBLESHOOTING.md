# Troubleshooting Guide

## Docker-First Development

**All development happens in Docker containers. If you encounter issues, they're likely Docker-related.**

## Common Issues and Solutions

### Issue 1: Workspace Resolution Errors in Docker

If you see errors about workspace packages not being found in containers:

```bash
# Rebuild containers from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or reinstall dependencies in container
docker-compose exec api npm install
```

### Issue 2: Peer Dependency Warnings

Some peer dependency warnings are normal and can be ignored. If they cause install failures in containers:

```bash
# Install with legacy peer deps flag in container
docker-compose exec api npm install --legacy-peer-deps
```

### Issue 3: Turbo Not Found

If turbo commands fail in containers:

```bash
# Use npx in container
docker-compose exec api npx turbo run dev
```

### Issue 4: TypeScript Version Conflicts

If you see TypeScript version conflicts in containers:

```bash
# Use npm's dedupe in container
docker-compose exec api npm dedupe
```

### Issue 5: Prisma Client Generation Issues

```bash
# Generate Prisma client in container
docker-compose exec api npx prisma generate
```

### Issue 6: Missing Dependencies in Workspaces

If workspace packages can't find each other in containers:

1. Ensure all packages are listed in root `package.json` workspaces
2. Check that package names match (e.g., `@pokedex-go/shared`)
3. Rebuild containers to ensure dependencies are installed:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue 7: Node Version in Docker

Node.js version is controlled by Docker images (defined in Dockerfiles):
- API uses Node 18 (see `docker/api.Dockerfile`)
- Web uses Node 20 (see `docker/web.Dockerfile`)

No local Node.js installation needed. To check version in container:

```bash
docker-compose exec api node --version
docker-compose exec web node --version
```

### Issue 8: Docker Permission Errors

If you see permission errors with Docker:

```bash
# On Linux, add user to docker group
sudo usermod -aG docker $USER
# Then log out and back in

# On macOS, ensure Docker Desktop has proper permissions
# Settings → Resources → File Sharing → Add project directory
```

## Step-by-Step Clean Docker Rebuild

If nothing works, try a complete clean Docker rebuild:

```bash
# 1. Stop all containers
docker-compose down

# 2. Remove containers and volumes (WARNING: deletes database data)
docker-compose down -v

# 3. Remove Docker images
docker-compose rm -f

# 4. Rebuild from scratch
docker-compose build --no-cache

# 5. Start services
docker-compose up -d

# 6. Run migrations
docker-compose exec api npm run db:migrate
```

## Docker-Specific Issues

### Containers Won't Start

```bash
# Check Docker is running
docker ps

# View detailed error messages
docker-compose logs

# Check container status
docker-compose ps
```

### Volume Mount Issues (File Changes Not Reflecting)

```bash
# Ensure volumes are properly mounted
docker-compose config

# Restart containers to remount volumes
docker-compose restart
```

### Database Connection from Containers

**Important:** From within containers, always use service names:
- ✅ `postgres:5432` (correct)
- ❌ `localhost:5432` (wrong - won't work)

From host machine, use `localhost:5432`.

## Getting Help

If you're still having issues, please share:

1. **Docker version**: `docker --version` and `docker compose version`
2. **Container logs**: `docker-compose logs`
3. **Container status**: `docker-compose ps`
4. **Full error output**: Copy the complete error message
5. **Operating system**: macOS, Linux, or Windows
6. **Docker Desktop settings**: Resources allocated, file sharing configured
7. **Any proxy/VPN settings**: Are you behind a corporate firewall?

