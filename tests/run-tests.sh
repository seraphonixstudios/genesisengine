#!/bin/bash

# E2E Test Runner Script
# Runs comprehensive tests for the AI Image Generator

set -e

echo "=========================================="
echo "AI Image Generator - E2E Test Suite"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting test environment...${NC}"

# Start services if not running
docker-compose up -d --wait

sleep 5

echo -e "${YELLOW}Waiting for API to be ready...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:5000/api/health 2>/dev/null || curl -f http://localhost:5000 2>/dev/null; then
        echo -e "${GREEN}API is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}API failed to start${NC}"
        docker-compose logs
        exit 1
    fi
    sleep 2
done

echo ""
echo -e "${YELLOW}Running API E2E Tests...${NC}"
npm run test:e2e:api

echo ""
echo -e "${YELLOW}Running Integration Tests...${NC}"
npm run test:integration

echo ""
echo -e "${YELLOW}Running Frontend E2E Tests...${NC}"
npm run test:e2e:frontend

echo ""
echo -e "${GREEN}=========================================="
echo "All Tests Completed!"
echo "==========================================${NC}"

# Optional: Show coverage
if [ "$1" == "--coverage" ]; then
    echo ""
    echo -e "${YELLOW}Generating coverage report...${NC}"
    npm run test:coverage
    echo "Coverage report generated in ./coverage"
fi

# Cleanup
if [ "$1" == "--cleanup" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up...${NC}"
    docker-compose down
fi
