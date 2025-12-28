# Ingestion System Documentation

## Overview

The ingestion system fetches Pokémon GO Game Master data from a public mirror, parses it, and populates the catalog database.

## Implementation Status

✅ **Completed:**
- Game Master JSON fetcher
- Parser for Pokémon, Moves, and Types
- Staging system (applies data immediately)
- Ingestion history tracking
- Web UI for viewing ingestion status and catalog data

⚠️ **Known Limitations:**

1. **Dex Number Mapping**: The `extractDexNumber` function uses a simplified approach. For production, you'll need a complete mapping table from Pokémon IDs to National Dex numbers. Currently, it has a small hardcoded mapping and falls back to a hash-based approach.

2. **Game Master Structure**: The parser assumes a specific JSON structure. If the Game Master format changes, the parser will need updates.

3. **Error Handling**: Errors are logged but ingestion continues. Some Pokémon may be skipped if data is malformed.

## Usage

### API Endpoints

All ingestion endpoints require authentication (JWT token).

- `GET /ingestion/history` - Get ingestion run history
- `GET /ingestion/state` - Get current ingestion state
- `GET /ingestion/check-updates` - Check if new data is available
- `POST /ingestion/run` - Run full ingestion

### Web UI

1. **Ingestion Page** (`/ingestion`):
   - View current ingestion status
   - Check for updates
   - Run ingestion manually
   - View ingestion history with status and errors

2. **Catalog Page** (`/catalog`):
   - View catalog statistics (species, forms, moves, types count)
   - Browse Pokémon species with pagination
   - See types, generation, and form counts

## Data Flow

```
1. Fetch Game Master JSON
   ↓
2. Parse JSON into structured data
   ↓
3. Stage data (create/update database records)
   ↓
4. Track ingestion run with summary
   ↓
5. Update ingestion state
```

## Parser Details

The `GameMasterParser` extracts:

- **Pokémon**: Species, forms, base stats, movesets
- **Moves**: Fast and charged moves with power, energy, duration
- **Types**: All Pokémon types found in the data

### Pokémon Parsing

- Extracts base stats (Attack, Defense, Stamina)
- Maps quick moves and cinematic moves
- Handles elite moves (legacy moves)
- Identifies default forms vs. variants

### Move Parsing

- Categorizes as FAST or CHARGED based on energy delta
- Extracts power, energy cost/gain, duration
- Normalizes move names from IDs

## Future Improvements

1. **Proper Dex Mapping**: Create a complete mapping table or use an external reference
2. **Staging with Approval**: Add ability to review changes before applying
3. **Diff View**: Show what changed between ingestion runs
4. **Incremental Updates**: Only update changed records
5. **Asset Ingestion**: Download and store Pokémon sprites/images
6. **Region Mapping**: Extract and map region data
7. **Evolution Chains**: Parse and store evolution relationships

## Running Ingestion in Docker

All ingestion runs happen in the Docker API container:

```bash
# View ingestion logs
docker-compose logs -f api

# Run ingestion via API (from host)
curl -X POST http://localhost:3001/ingestion/run \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Or access container directly
docker-compose exec api sh
# Then run commands inside container
```

## Troubleshooting

### Ingestion Fails

- Check `GAME_MASTER_MIRROR_URL` in `.env` file (used by Docker containers)
- Verify network connectivity from container (may need proxy settings)
- Check container logs: `docker-compose logs api`
- Ensure database container is running: `docker-compose ps postgres`
- Verify database connection uses service name `postgres` (not `localhost`)

### Missing Pokémon

- Verify Game Master JSON structure hasn't changed
- Check parser logs for skipped entries
- Review error messages in ingestion run history

### Dex Numbers Incorrect

- The current implementation uses a placeholder mapping
- Update `extractDexNumber` with a complete mapping table
- Consider using an external Pokémon database for reference

