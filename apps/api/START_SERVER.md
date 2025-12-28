# Starting the API Server

## Docker-First Development

**The API server runs in a Docker container. All development happens in Docker.**

## Quick Start

```bash
# Start all services (including API)
docker-compose up -d

# View API logs
docker-compose logs -f api
```

The API server will start on `http://localhost:3001` (or the port specified in your `.env` file).

**Note:** The API runs in watch mode, so code changes are automatically reflected.

## Troubleshooting

### Issue: Server doesn't start

1. **Check if container is running:**
   ```bash
   docker-compose ps
   # Should show 'api' container as 'Up'
   ```

2. **Check container logs:**
   ```bash
   docker-compose logs api
   # Look for error messages
   ```

3. **Check if port is already in use:**
   ```bash
   lsof -i :3001
   # If something is using it, kill it or change the port in .env
   ```

4. **Check if database container is running:**
   ```bash
   docker-compose ps postgres
   # Should show 'postgres' container as 'Up'
   ```

5. **Verify environment variables:**
   ```bash
   # Check if .env file exists in project root
   ls -la .env
   
   # Should have at minimum:
   # DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pokedexgo?schema=public"
   # JWT_SECRET="..."
   # API_PORT=3001
   ```

6. **Generate Prisma client:**
   ```bash
   docker-compose exec api npm run db:generate
   ```

7. **Run database migrations:**
   ```bash
   docker-compose exec api npm run db:migrate
   ```

### Issue: "Cannot connect to database"

- Verify `DATABASE_URL` in `.env` uses service name `postgres` (not `localhost`):
  ```
  DATABASE_URL="postgresql://postgres:postgres@postgres:5432/pokedexgo?schema=public"
  ```
- Ensure PostgreSQL container is running: `docker-compose ps postgres`
- Check database container logs: `docker-compose logs postgres`
- Verify containers are on same network: `docker network ls`

### Issue: Module not found errors

```bash
# Reinstall dependencies in container
docker-compose exec api npm install

# Or rebuild container
docker-compose down api
docker-compose build api
docker-compose up -d api

# Generate Prisma client
docker-compose exec api npm run db:generate
```

## Verifying Server is Running

Check container logs:
```bash
docker-compose logs api
```

You should see:
```
API server running on port 3001
```

Test with:
```bash
curl http://localhost:3001/catalog/stats
```

If successful, you should get JSON back with catalog statistics.

**Note:** The API runs in watch mode inside the container, so code changes are automatically reflected.

