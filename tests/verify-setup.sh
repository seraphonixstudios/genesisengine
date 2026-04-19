#!/bin/bash

# Quick Test Verification
# Runs syntax checks and basic test setup validation

echo "=========================================="
echo "Test Suite Validation"
echo "=========================================="
echo ""

# Check test files exist
echo "Checking test files..."
test_files=(
  "tests/e2e/system.test.ts"
  "tests/e2e/frontend.test.ts"
  "tests/integration/api.test.ts"
  "tests/setup.ts"
  "jest.config.js"
  "playwright.config.ts"
)

all_exist=true
for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file"
    all_exist=false
  fi
done

echo ""

if [ "$all_exist" = true ]; then
  echo "✓ All test files present"
else
  echo "✗ Some test files missing"
  exit 1
fi

echo ""
echo "Checking Jest installation..."
if npm ls jest > /dev/null 2>&1; then
  echo "✓ Jest installed"
else
  echo "✗ Jest not found"
  exit 1
fi

echo ""
echo "Checking TypeScript installation..."
if npm ls typescript > /dev/null 2>&1; then
  echo "✓ TypeScript installed"
else
  echo "✗ TypeScript not found"
  exit 1
fi

echo ""
echo "Checking Playwright installation..."
if npm ls @playwright/test > /dev/null 2>&1; then
  echo "✓ Playwright installed"
else
  echo "✗ Playwright not found"
  exit 1
fi

echo ""
echo "=========================================="
echo "Test Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start the API: npm run server"
echo "2. In another terminal, run tests:"
echo "   npm run test:e2e:api"
echo "   npm run test:integration"
echo "   npm run test:e2e:frontend"
