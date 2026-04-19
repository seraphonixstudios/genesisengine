#!/bin/bash
#
# Post-Deployment Verification Script
# Tests that the deployed system is working correctly
#

VPS_IP="76.13.242.128"
VPS_USER="root"
APP_URL="http://${VPS_IP}:3000"

echo "=============================================="
echo "  Deployment Verification"
echo "=============================================="
echo ""
echo "Testing: ${APP_URL}"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

test_warn() {
    echo -e "${YELLOW}!${NC} $1"
}

# Test 1: Server is running
echo "Test 1: Checking if server is running..."
PID=$(ssh ${VPS_USER}@${VPS_IP} "pgrep -f 'node.*server'" 2>/dev/null)
if [ -n "$PID" ]; then
    test_pass "Server process found (PID: $PID)"
else
    test_fail "Server not running"
fi

# Test 2: PM2 status
echo ""
echo "Test 2: Checking PM2 status..."
PM2_STATUS=$(ssh ${VPS_USER}@${VPS_IP} "pm2 list | grep ai-image-generator | grep -o 'online'" 2>/dev/null)
if [ "$PM2_STATUS" == "online" ]; then
    test_pass "PM2 shows status: online"
else
    test_fail "PM2 status not online"
fi

# Test 3: Health endpoint
echo ""
echo "Test 3: Testing health endpoint..."
HEALTH=$(ssh ${VPS_USER}@${VPS_IP} "curl -s http://localhost:3000/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"online"'; then
    test_pass "Health endpoint responding"
    echo "    Response: $HEALTH"
else
    test_fail "Health endpoint not responding correctly"
fi

# Test 4: Port is listening
echo ""
echo "Test 4: Checking if port 3000 is listening..."
PORT_CHECK=$(ssh ${VPS_USER}@${VPS_IP} "netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000" 2>/dev/null)
if [ -n "$PORT_CHECK" ]; then
    test_pass "Port 3000 is listening"
else
    test_fail "Port 3000 not listening"
fi

# Test 5: Frontend accessible
echo ""
echo "Test 5: Testing frontend accessibility..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_IP}:3000 2>/dev/null)
if [ "$FRONTEND" == "200" ] || [ "$FRONTEND" == "304" ]; then
    test_pass "Frontend accessible (HTTP $FRONTEND)"
else
    test_warn "Frontend returned HTTP $FRONTEND (may need to wait longer)"
fi

# Test 6: API endpoints
echo ""
echo "Test 6: Testing API endpoints..."

# Test models endpoint
MODELS=$(curl -s http://${VPS_IP}:3000/api/models 2>/dev/null)
if echo "$MODELS" | grep -q '"models"'; then
    test_pass "Models endpoint working"
else
    test_fail "Models endpoint not responding"
fi

# Summary
echo ""
echo "=============================================="
echo "  Verification Summary"
echo "=============================================="
echo ""
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your AI Image Generator is fully operational!"
    echo ""
    echo "Access it at:"
    echo "  • http://${VPS_IP}:3000"
    echo "  • http://${VPS_IP}:3000/api/health"
    echo ""
    echo "Demo login:"
    echo "  • Email: demo@example.com"
    echo "  • Password: demo123"
    exit 0
else
    echo -e "${YELLOW}! SOME TESTS FAILED${NC}"
    echo ""
    echo "The system may still be starting up."
    echo "Wait 30 seconds and run this script again."
    echo ""
    echo "Debug commands:"
    echo "  ssh ${VPS_USER}@${VPS_IP} 'pm2 logs ai-image-generator'"
    echo "  ssh ${VPS_USER}@${VPS_IP} 'pm2 status'"
    exit 1
fi
