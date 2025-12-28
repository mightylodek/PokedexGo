# Architecture Documentation

## Docker-First Architecture

**All environments (development, staging, production) are identical except for environment variables.**

This project uses Docker for all development and deployment:
- ✅ Same Docker images run in all environments
- ✅ Only `.env` file differs between environments
- ✅ No local Node.js or PostgreSQL installation required
- ✅ Consistent behavior across all platforms

## Core Principle

**Pokémon data is static, canonical, and normalized. Battle mechanics are dynamic, versioned, and modular.**

Battle logic consumes Pokémon data — never owns it.

## Module Separation

### 1. Catalog / Canonical Data (`apps/api/catalog`)

**Purpose**: Store and serve static Pokémon data

**Data Types**:
- Pokémon species
- Forms
- Base stats
- Moves
- Types
- Learnsets
- Regions
- Assets

**Rules**:
- ✅ Ingest-driven (no manual edits in production)
- ✅ No derived battle values
- ✅ No per-battle state
- ✅ No ruleset assumptions

**Database**: PostgreSQL via Prisma (runs in Docker container)

### 2. Battle Engine (`packages/battle-engine`)

**Purpose**: Pure, deterministic battle simulation logic

**Constraints**:
- ❌ No Prisma
- ❌ No NestJS
- ❌ No HTTP
- ❌ No database
- ✅ Deterministic functions only
- ✅ Fully unit-testable
- ✅ Versioned rulesets

**Exports**:
- `simulateBattle(input): BattleSimulationResult`
- `calculateDamage(input): number`
- `calculateCP(input): number`
- `calculateHP(input): number`

**Data Flow**: Accepts snapshots (plain objects), returns results

### 3. Battle Runtime / Orchestration (`apps/api/battles`)

**Purpose**: Bridge between catalog and battle engine

**Responsibilities**:
- Fetch catalog data from database
- Build battle-ready snapshots
- Pass snapshots to battle-engine
- Return text-only battle logs
- Stateless battle simulation endpoint

## Data Flow

```
┌─────────────┐
│   Catalog   │ (Database)
│   (Prisma)  │
└──────┬──────┘
       │
       │ Fetch data
       ▼
┌─────────────┐
│ Battles API │ (NestJS)
│   Service   │
└──────┬──────┘
       │
       │ Build snapshot
       ▼
┌─────────────┐
│   Battle    │ (Pure TypeScript)
│   Engine    │
└──────┬──────┘
       │
       │ Return result
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## Assumptions & Future-Breaking Decisions

### Battle Engine Assumptions

1. **CP Multiplier Table**: Simplified discrete table. Actual GO uses continuous formula.
2. **Damage Formula**: Simplified version. Actual GO includes:
   - Fast move damage windows
   - Charge move timing
   - CMP (Charge Move Priority)
   - More complex stat calculations

3. **Type Effectiveness**: Standard 18-type chart. May need updates for:
   - Regional variants
   - Special type interactions
   - Future type additions

4. **Turn Resolution**: Simplified alternating turns. Actual GO has:
   - Simultaneous fast moves
   - Charge move priority
   - Swap mechanics
   - Switch timers

### Catalog Assumptions

1. **Game Master Structure**: Assumes current JSON structure. May change with updates.
2. **Field Mappings**: Some fields may be ambiguous or require manual verification.
3. **Derived vs Source**: Some values may need to be computed vs ingested.

## Rollback Plan

If battle module needs to be removed:

1. Disable `BattlesModule` in `app.module.ts`
2. Remove `packages/battle-engine` package
3. Revert any battle-related migrations (if any)
4. Retain full Pokédex functionality

Catalog remains fully functional independently.

## Versioning Strategy

### Battle Rulesets

Battle rulesets are versioned and can be swapped without database changes:

```typescript
interface BattleRuleset {
  version: string; // e.g., "1.0.0"
  // ... rules
}
```

### Catalog Data

Catalog data is versioned via ingestion runs:
- Each ingestion run tracks timestamp
- Changes are staged before application
- Admin UI shows diffs before approval

## Testing Strategy

### Battle Engine
- Unit tests for all calculation functions
- Deterministic results (same input = same output)
- No mocking needed (pure functions)

### Catalog
- Integration tests with test database
- Verify data normalization
- Test ingestion pipeline

### API
- E2E tests for battle simulation endpoint
- Verify snapshot building
- Test auth flows

