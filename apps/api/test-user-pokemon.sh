#!/bin/bash
# Manual Integration Test Script for User Pokemon Management API
# Make sure the API server is running on http://localhost:3001

API_URL="http://localhost:3001"
TOKEN=""

echo "=== User Pokemon Management API Tests ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API server is running (non-blocking - just a warning)
echo "Checking if API server is accessible..."
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 --max-time 2 "$API_URL/catalog/stats" 2>/dev/null || echo "000")

if [ "$SERVER_CHECK" = "200" ]; then
  echo -e "${GREEN}✓${NC} API server is accessible"
elif [ "$SERVER_CHECK" != "000" ]; then
  echo -e "${YELLOW}⚠${NC} API server responded with HTTP $SERVER_CHECK (will continue anyway)"
else
  echo -e "${YELLOW}⚠${NC} Could not verify API server connection (will attempt anyway)"
  echo "  If tests fail, ensure server is running: cd apps/api && npm run dev"
fi
echo ""

# Step 1: Register a test user
echo "Step 1: Registering test user..."
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pokedex.test",
    "password": "test123456",
    "displayName": "Test User"
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "201" ] || echo "$REGISTER_BODY" | grep -q "accessToken"; then
  TOKEN=$(echo "$REGISTER_BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$REGISTER_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)
  fi
  echo -e "${GREEN}✓${NC} User registered successfully"
else
  # Try login if user already exists
  echo "User may already exist (status: $HTTP_STATUS), attempting login..."
  LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@pokedex.test",
      "password": "test123456"
    }')
  
  HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
  LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS:/d')
  
  if [ "$HTTP_STATUS" = "200" ] || echo "$LOGIN_BODY" | grep -q "accessToken"; then
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ -z "$TOKEN" ]; then
      TOKEN=$(echo "$LOGIN_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)
    fi
    echo -e "${GREEN}✓${NC} User logged in successfully"
  else
    echo -e "${RED}✗${NC} Failed to authenticate (HTTP $HTTP_STATUS)"
    echo "Response: $LOGIN_BODY"
    echo ""
    echo "Debugging info:"
    echo "  - API URL: $API_URL"
    echo "  - Check if server is running: curl $API_URL/catalog/stats"
    exit 1
  fi
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗${NC} Failed to extract access token from response"
  echo "Register response: $REGISTER_BODY"
  echo "Login response: $LOGIN_BODY"
  exit 1
fi

echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Get a Pokemon form ID from catalog
echo "Step 2: Fetching a Pokemon form from catalog..."
FORM_RESPONSE=$(curl -s "$API_URL/catalog/pokemon?take=1")
FORM_ID=$(echo "$FORM_RESPONSE" | grep -o '"forms":\[{"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$FORM_ID" ]; then
  # Try alternative JSON parsing
  FORM_ID=$(echo "$FORM_RESPONSE" | grep -o '"id":"[a-f0-9-]\{36\}"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$FORM_ID" ]; then
  echo -e "${YELLOW}⚠${NC} Could not extract form ID automatically"
  echo "Please provide a form ID manually, or ensure catalog has data"
  echo "Response sample: ${FORM_RESPONSE:0:200}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Found form ID: $FORM_ID"
echo ""

# Step 3: Create a Pokemon instance
echo "Step 3: Creating a Pokemon instance..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/me/pokemon" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"formId\": \"$FORM_ID\",
    \"levelTimes2\": 40,
    \"ivAtk\": 15,
    \"ivDef\": 15,
    \"ivSta\": 15,
    \"nickname\": \"Test Pokemon\",
    \"notes\": \"Created by test script\",
    \"favorite\": true
  }")

if echo "$CREATE_RESPONSE" | grep -q "\"id\""; then
  INSTANCE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
  echo -e "${GREEN}✓${NC} Pokemon instance created: $INSTANCE_ID"
  echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
else
  echo -e "${RED}✗${NC} Failed to create instance: $CREATE_RESPONSE"
  exit 1
fi
echo ""

# Step 4: Get collection stats
echo "Step 4: Getting collection statistics..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/me/pokemon/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q "totalCount"; then
  echo -e "${GREEN}✓${NC} Collection stats retrieved:"
  echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
else
  echo -e "${YELLOW}⚠${NC} Stats response: $STATS_RESPONSE"
fi
echo ""

# Step 5: List all instances
echo "Step 5: Listing all Pokemon instances..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/me/pokemon" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIST_RESPONSE" | grep -q "\"id\""; then
  echo -e "${GREEN}✓${NC} Instances retrieved:"
  echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30 || echo "$LIST_RESPONSE" | head -5
else
  echo -e "${YELLOW}⚠${NC} List response: $LIST_RESPONSE"
fi
echo ""

# Step 6: Get specific instance
if [ ! -z "$INSTANCE_ID" ]; then
  echo "Step 6: Getting specific Pokemon instance..."
  GET_RESPONSE=$(curl -s -X GET "$API_URL/me/pokemon/$INSTANCE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$GET_RESPONSE" | grep -q "\"id\""; then
    echo -e "${GREEN}✓${NC} Instance retrieved successfully"
    echo "$GET_RESPONSE" | python3 -m json.tool 2>/dev/null | head -40 || echo "$GET_RESPONSE" | head -10
  else
    echo -e "${RED}✗${NC} Failed to get instance: $GET_RESPONSE"
  fi
  echo ""
fi

# Step 7: Update instance
if [ ! -z "$INSTANCE_ID" ]; then
  echo "Step 7: Updating Pokemon instance..."
  UPDATE_RESPONSE=$(curl -s -X PATCH "$API_URL/me/pokemon/$INSTANCE_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "nickname": "Updated Test Pokemon",
      "ivAtk": 14,
      "notes": "Updated by test script"
    }')
  
  if echo "$UPDATE_RESPONSE" | grep -q "\"nickname\""; then
    echo -e "${GREEN}✓${NC} Instance updated successfully"
    UPDATED_NICKNAME=$(echo "$UPDATE_RESPONSE" | grep -o '"nickname":"[^"]*' | cut -d'"' -f4)
    echo "Updated nickname: $UPDATED_NICKNAME"
    
    # Check if CP was recalculated
    if echo "$UPDATE_RESPONSE" | grep -q "\"cp\""; then
      echo -e "${GREEN}✓${NC} CP value present (should be recalculated)"
    fi
  else
    echo -e "${RED}✗${NC} Failed to update instance: $UPDATE_RESPONSE"
  fi
  echo ""
fi

# Step 8: Delete instance (optional - comment out to keep test data)
if [ ! -z "$INSTANCE_ID" ]; then
  echo "Step 8: Deleting Pokemon instance..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/me/pokemon/$INSTANCE_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$DELETE_RESPONSE" | grep -q "successfully"; then
    echo -e "${GREEN}✓${NC} Instance deleted successfully"
  else
    echo -e "${YELLOW}⚠${NC} Delete response: $DELETE_RESPONSE"
  fi
  echo ""
fi

echo -e "${GREEN}=== All tests completed! ===${NC}"

