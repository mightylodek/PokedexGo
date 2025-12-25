# Starting the API Server

## Quick Start

```bash
cd apps/api
npm run dev
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## Troubleshooting

### Issue: Server doesn't start

1. **Check if port is already in use:**
   ```bash
   lsof -i :3001
   # If something is using it, kill it or change the port in .env
   ```

2. **Check if database is running:**
   ```bash
   # If using Docker
   docker ps | grep postgres
   
   # If using local PostgreSQL
   psql -U postgres -h localhost -d pokedexgo
   ```

3. **Verify environment variables:**
   ```bash
   # Check if .env file exists
   ls -la .env
   
   # Should have at minimum:
   # DATABASE_URL="postgresql://..."
   # JWT_SECRET="..."
   # API_PORT=3001
   ```

4. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

### Issue: "Cannot connect to database"

- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running
- Check database name exists: `pokedexgo`

### Issue: Module not found errors

```bash
# Reinstall dependencies
cd ../..  # Go to project root
npm install

# Generate Prisma client
cd apps/api
npm run db:generate
```

## Verifying Server is Running

Once started, you should see:
```
API server running on port 3001
```

Test with:
```bash
curl http://localhost:3001/catalog/stats
```

If successful, you should get JSON back with catalog statistics.

