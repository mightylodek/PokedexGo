# Next Steps: User Pokemon Management Testing

## Current Status

### ✅ What's Been Completed

1. **CRUD Implementation** - Full implementation of:
   - ✅ `POST /me/pokemon` - Create Pokemon instance
   - ✅ `GET /me/pokemon` - List all instances (with pagination)
   - ✅ `GET /me/pokemon/stats` - Collection statistics
   - ✅ `GET /me/pokemon/:id` - Get specific instance
   - ✅ `PATCH /me/pokemon/:id` - Update instance
   - ✅ `DELETE /me/pokemon/:id` - Delete instance

2. **Features Implemented:**
   - ✅ CP/HP automatic calculation using battle-engine
   - ✅ CP/HP recalculation on IV/level changes
   - ✅ User ownership validation
   - ✅ Form existence validation
   - ✅ JWT authentication on all endpoints

3. **Test Files Created:**
   - ✅ Unit tests for service (10 test cases)
   - ✅ Unit tests for controller (6 test cases)
   - ✅ Integration test script (`test-user-pokemon.sh`)
   - ✅ Jest configuration fixed for workspace packages

### ❌ What's NOT Tested Yet

1. **Unit Tests** - Written but not executed
   - Jest dependencies need to be installed
   - Tests need to be run to verify they pass

2. **Integration/CRUD Testing** - Not performed yet
   - Need running API server
   - Need database with data
   - Need to actually test the endpoints work end-to-end

## Testing Plan

### Step 1: Run Unit Tests (When Dependencies Are Available)

```bash
cd apps/api
npm install  # If dependencies are missing
npm test -- user-pokemon
```

**Expected:** All 16 test cases should pass

### Step 2: Integration Testing - Test Actual CRUD Operations

This is the most important step to verify CRUD works correctly.

#### Prerequisites:
1. **Database running** (PostgreSQL)
2. **API server running** on `http://localhost:3001`
3. **Catalog data ingested** (at least one Pokemon form exists)

#### Option A: Use the Integration Test Script

```bash
cd apps/api
./test-user-pokemon.sh
```

This script will:
1. Register/login a test user
2. Fetch a Pokemon form from catalog
3. **CREATE** a Pokemon instance
4. **READ** collection stats
5. **READ** list of instances
6. **READ** specific instance
7. **UPDATE** instance (test CP recalculation)
8. **DELETE** instance

#### Option B: Manual Testing with curl

**1. Register/Login:**
```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "displayName": "Test User"}'

# Login (save the accessToken from response)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**2. Get a Form ID:**
```bash
curl http://localhost:3001/catalog/pokemon?take=1
# Extract a form ID from the response
```

**3. CREATE - Create Pokemon Instance:**
```bash
curl -X POST http://localhost:3001/me/pokemon \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "formId": "FORM_ID_HERE",
    "levelTimes2": 40,
    "ivAtk": 15,
    "ivDef": 15,
    "ivSta": 15,
    "nickname": "My Pokemon",
    "favorite": true
  }'
```

**Verify:** Response should include `cp` and `hp` values (calculated automatically)

**4. READ - List All Instances:**
```bash
curl http://localhost:3001/me/pokemon \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**5. READ - Get Collection Stats:**
```bash
curl http://localhost:3001/me/pokemon/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**6. READ - Get Specific Instance:**
```bash
curl http://localhost:3001/me/pokemon/INSTANCE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**7. UPDATE - Update Instance (test CP recalculation):**
```bash
curl -X PATCH http://localhost:3001/me/pokemon/INSTANCE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "nickname": "Updated Name",
    "ivAtk": 14
  }'
```

**Verify:** The `cp` value should change (recalculated based on new IV)

**8. DELETE - Delete Instance:**
```bash
curl -X DELETE http://localhost:3001/me/pokemon/INSTANCE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Verify:** Instance is deleted, subsequent GET should return 404

## What to Verify During CRUD Testing

### CREATE
- ✅ Instance is created successfully
- ✅ CP and HP are calculated correctly
- ✅ All fields are saved correctly
- ✅ Returns 404 if form doesn't exist
- ✅ Returns 401 if not authenticated

### READ (List)
- ✅ Returns only instances belonging to authenticated user
- ✅ Pagination works (skip/take parameters)
- ✅ Includes related data (form, species, types)

### READ (Single)
- ✅ Returns instance if it belongs to user
- ✅ Returns 404 if instance doesn't exist
- ✅ Returns 403 if instance belongs to different user
- ✅ Includes all related data (moves, tags, etc.)

### READ (Stats)
- ✅ Returns correct counts
- ✅ Total CP sum is correct
- ✅ Unique species count is correct

### UPDATE
- ✅ Updates work with partial data
- ✅ CP/HP recalculate when IVs or level change
- ✅ CP/HP don't recalculate when only nickname/notes change
- ✅ Returns 403 if instance belongs to different user
- ✅ Returns 404 if instance doesn't exist

### DELETE
- ✅ Instance is deleted
- ✅ Returns 404 if instance doesn't exist
- ✅ Returns 403 if instance belongs to different user
- ✅ Related tags are cascade deleted

## Recommended Next Steps

1. **Immediate:** Run integration tests (CRUD) using the test script or manual curl commands
2. **After CRUD works:** Move on to implementing User Favorites module
3. **Later:** Set up CI/CD to run tests automatically

## Current Blockers

- Jest unit tests require dependencies to be installed (network access needed)
- Integration tests require running API server and database
- Need to verify CP/HP calculations match expected values

