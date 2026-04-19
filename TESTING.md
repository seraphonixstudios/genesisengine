# Test Scripts and Instructions

## Quick Start

### Run All Tests
```bash
npm run test
```

### Run Specific Test Suites

#### E2E API Tests (Jest + Axios)
```bash
npm run test:e2e:api
```
Tests complete API workflows including:
- User registration and authentication
- Image generation requests
- Generation status polling
- Gallery and history retrieval
- Error handling and validation

#### Integration Tests
```bash
npm run test:integration
```
Tests individual API endpoints:
- Auth endpoints (register, login)
- Protected endpoints (requires token)
- Generation endpoints
- Model listing
- Data validation

#### Frontend E2E Tests (Playwright)
```bash
npm run test:e2e:frontend
```
Tests UI workflows across browsers:
- User registration flow
- Main generator interface
- Image generation interaction
- Gallery navigation
- Responsive design (mobile, tablet, desktop)

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## Environment Setup

Create a `.env.test` file or set environment variables:

```bash
# API Configuration
API_URL=http://localhost:5000/api
FRONTEND_URL=http://localhost:5173

# Database (for testing)
DATABASE_URL=file:./test.db
NODE_ENV=test

# JWT (use test keys)
JWT_SECRET=test-secret-key

# Optional: API Rate Limiting (disable for tests)
RATE_LIMIT_ENABLED=false
```

## Docker-Based Testing

### Start Services for Testing
```bash
docker-compose up -d
```

### Run Full Test Suite with Docker
```bash
./tests/run-tests.sh
```

### Run Tests with Coverage and Cleanup
```bash
./tests/run-tests.sh --coverage --cleanup
```

## Test Structure

### `/tests/e2e/system.test.ts`
- **Authentication Flow**: Register, login, token handling
- **User Profile**: Get user data, validate permissions
- **Image Generation**: Create generations, validate input
- **Status Polling**: Check generation status and results
- **Gallery**: List and filter user images
- **Models**: List available AI models
- **Error Handling**: Invalid input, missing auth, malformed data
- **Complete Workflow**: Full user journey from signup to image generation

### `/tests/e2e/frontend.test.ts`
- **Auth Pages**: Login/register page loading and validation
- **Registration**: Form submission and validation
- **Generator Interface**: All UI controls and interactions
- **Image Generation**: Generation process and feedback
- **Gallery Page**: Image listing and preview
- **Navigation**: Inter-page navigation and menu
- **User Info**: Credits display, plan info, logout
- **Responsive**: Mobile, tablet, and desktop layouts

### `/tests/integration/api.test.ts`
- **Health Check**: API availability
- **Auth Endpoints**: Register and login
- **Protected Routes**: Token validation
- **Generation API**: Create and list generations
- **Models API**: Available models endpoint
- **Error Handling**: 4xx and 5xx responses
- **Rate Limiting**: Concurrent request handling
- **Validation**: Email, password, dimensions

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run E2E Tests
        run: npm run test:e2e:api
      
      - name: Run Integration Tests
        run: npm run test:integration
      
      - name: Run Frontend E2E Tests
        run: npm run test:e2e:frontend
```

## Test Coverage Goals

- **Authentication**: 95%+ coverage
- **API Endpoints**: 90%+ coverage
- **Image Generation**: 85%+ coverage
- **User Interface**: 80%+ coverage
- **Error Handling**: 90%+ coverage

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should register a new user"
```

### Run with Debug Output
```bash
DEBUG=* npm run test:e2e:api
```

### Playwright Inspector
```bash
PWDEBUG=1 npm run test:e2e:frontend
```

### Keep Browser Open
Edit `playwright.config.ts` and set:
```typescript
use: {
  headless: false,
}
```

## Troubleshooting

### API Not Ready
```bash
# Check API logs
docker-compose logs api

# Restart services
docker-compose restart
```

### Tests Timeout
- Increase timeout in `jest.config.js` or `playwright.config.ts`
- Check API is responding: `curl http://localhost:5000/api/health`
- Check network connectivity between containers

### Port Conflicts
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Issues
```bash
# Reset test database
rm test.db
npm run db:migrate
```

## Performance Tips

1. Run tests in parallel where possible
2. Use test database (SQLite for speed)
3. Mock external APIs (image generation can be stubbed)
4. Use shallow rendering for component tests
5. Cache dependencies in CI/CD

## Next Steps

- Add visual regression testing with Percy or Chromatic
- Add performance testing with Lighthouse
- Add accessibility testing with axe-core
- Add security scanning with OWASP ZAP
- Add load testing with k6 or Artillery
