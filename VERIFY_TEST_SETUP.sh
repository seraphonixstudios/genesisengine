#!/bin/bash
# Final Test Suite Verification
# Confirms all test files are in place and configured correctly

echo "=========================================="
echo "AI Image Generator - Test Suite Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (NOT FOUND)"
        ((FAIL++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (NOT FOUND)"
        ((FAIL++))
    fi
}

echo "Test Files:"
check_file "tests/e2e/system.test.ts"
check_file "tests/e2e/frontend.test.ts"
check_file "tests/integration/api.test.ts"
check_file "tests/setup.ts"
echo ""

echo "Configuration Files:"
check_file "jest.config.js"
check_file "playwright.config.ts"
echo ""

echo "Documentation:"
check_file "TESTING.md"
check_file "TEST_SUITE.md"
check_file "E2E_TEST_IMPLEMENTATION.md"
check_file "TEST_EXAMPLES.ts"
echo ""

echo "Helper Scripts:"
check_file "tests/run-tests.sh"
check_file "tests/verify-setup.sh"
echo ""

echo "Directories:"
check_dir "tests"
check_dir "tests/e2e"
check_dir "tests/integration"
echo ""

echo "Dependencies Check:"
if grep -q '"jest"' package.json; then
    echo -e "${GREEN}✓${NC} jest in package.json"
    ((PASS++))
else
    echo -e "${RED}✗${NC} jest NOT in package.json"
    ((FAIL++))
fi

if grep -q '"@playwright/test"' package.json; then
    echo -e "${GREEN}✓${NC} @playwright/test in package.json"
    ((PASS++))
else
    echo -e "${RED}✗${NC} @playwright/test NOT in package.json"
    ((FAIL++))
fi

echo ""
echo "Test Scripts Check:"
if grep -q '"test:e2e:api"' package.json; then
    echo -e "${GREEN}✓${NC} test:e2e:api script"
    ((PASS++))
else
    echo -e "${RED}✗${NC} test:e2e:api script NOT found"
    ((FAIL++))
fi

if grep -q '"test:e2e:frontend"' package.json; then
    echo -e "${GREEN}✓${NC} test:e2e:frontend script"
    ((PASS++))
else
    echo -e "${RED}✗${NC} test:e2e:frontend script NOT found"
    ((FAIL++))
fi

if grep -q '"test:integration"' package.json; then
    echo -e "${GREEN}✓${NC} test:integration script"
    ((PASS++))
else
    echo -e "${RED}✗${NC} test:integration script NOT found"
    ((FAIL++))
fi

echo ""
echo "=========================================="
echo "Verification Results"
echo "=========================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Test suite is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. npm run server                    (start API)"
    echo "2. npm run test:e2e:api              (run API tests)"
    echo "3. npm run test:integration          (run integration tests)"
    echo "4. npm run test:e2e:frontend         (run frontend tests)"
    echo ""
    echo "For more info: cat TESTING.md"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the above output.${NC}"
    exit 1
fi
