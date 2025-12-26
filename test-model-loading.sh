#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Model Loading API Test Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Check if app is running
echo -e "${YELLOW}[TEST 1]${NC} Checking if Next.js app is running on localhost:3000..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ App is running${NC}"
else
    echo -e "${RED}✗ App is NOT running${NC}"
    echo "   Please start the app: pnpm dev"
    exit 1
fi
echo ""

# Test 2: Check if llama-server is running
echo -e "${YELLOW}[TEST 2]${NC} Checking if llama-server is running on localhost:8134..."
if curl -s http://localhost:8134/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ llama-server is running${NC}"
else
    echo -e "${RED}✗ llama-server is NOT running${NC}"
    echo "   Please start llama-server:"
    echo "   llama-server -m /path/to/model.gguf --port 8134 --host localhost"
    exit 1
fi
echo ""

# Test 3: Get models list via API
echo -e "${YELLOW}[TEST 3]${NC} Getting models list from API..."
MODELS_RESPONSE=$(curl -s -X GET http://localhost:3000/api/models \
  -H "Content-Type: application/json")

if echo "$MODELS_RESPONSE" | grep -q "models"; then
    echo -e "${GREEN}✓ Models endpoint working${NC}"
    MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o '"name":' | wc -l)
    echo "   Found $MODEL_COUNT model(s)"
    echo "   Response: $MODELS_RESPONSE" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Models endpoint failed${NC}"
    echo "   Response: $MODELS_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Try to load a model
echo -e "${YELLOW}[TEST 4]${NC} Attempting to load a model..."
echo "   (Assuming there's at least one model available)"

# Extract first model name from response
MODEL_NAME=$(echo "$MODELS_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MODEL_NAME" ]; then
    echo -e "${YELLOW}⚠ No models found to test loading${NC}"
    echo "   Please ensure you have models in your models directory"
else
    echo "   Testing with model: $MODEL_NAME"
    
    LOAD_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/models/$MODEL_NAME/start" \
      -H "Content-Type: application/json" \
      -d '{}')
    
    if echo "$LOAD_RESPONSE" | grep -q '"status":"loaded"'; then
        echo -e "${GREEN}✓ Model load API succeeded${NC}"
        echo "   Response: $LOAD_RESPONSE" | head -c 300
        echo "..."
    else
        echo -e "${YELLOW}⚠ Model load API returned response but may not have loaded${NC}"
        echo "   Response: $LOAD_RESPONSE" | head -c 300
        echo "..."
        echo ""
        echo "   This could mean:"
        echo "   1. llama-server is running but model load failed"
        echo "   2. Check llama-server logs for errors"
        echo "   3. Verify model file exists and is accessible"
    fi
fi
echo ""

# Test 5: Settings UI check
echo -e "${YELLOW}[TEST 5]${NC} Checking Settings page..."
if curl -s http://localhost:3000/settings | grep -q "Llama-Server Settings"; then
    echo -e "${GREEN}✓ Settings page loads${NC}"
else
    echo -e "${RED}✗ Settings page may have issues${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All tests completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/models to see the Models page"
echo "2. Try clicking 'Load' on a model"
echo "3. Check browser console (F12) for API responses"
echo "4. Check terminal logs for [API] messages"
echo ""
echo "For detailed debugging: see MODEL_LOADING_DEBUG.md"
