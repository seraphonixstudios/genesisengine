# Docker Setup - Quick Start

## Files Generated

1. **Dockerfile** - Multi-stage production build
   - Dependencies stage: isolated npm install for better caching
   - Builder stage: compiles Prisma client and app code
   - Production stage: minimal runtime with only needed packages
   - Non-root user (nodejs:1001) for security
   - Health checks enabled

2. **Dockerfile.production** - Optimized production variant
   - Smaller image size (no dev dependencies)
   - Uses dumb-init for signal handling
   - Additional security hardening

3. **docker-compose.yml** - Development environment
   - PostgreSQL 15-alpine database
   - Redis 7-alpine cache
   - App service with hot-reload volumes
   - Adminer UI for database management
   - Network isolation

4. **.dockerignore** - Optimized build context
   - Excludes node_modules, tests, logs, docs
   - Improves build performance

5. **.env.example** - Configuration template

## Quick Start

### Development
```bash
# Copy environment file
cp .env.example .env

# Start all services
docker compose up --pull always

# Or with specific service
docker compose up postgres redis app

# View logs
docker compose logs -f app
```

### View Database
- Open http://localhost:8080 (Adminer)
- Server: postgres
- Username: postgres (from .env)
- Password: postgres (from .env)
- Database: ai_image_generator

### Production
```bash
# Use production compose file
docker compose -f docker-compose.production.yml up -d

# Set required environment variables
export JWT_SECRET="your-production-secret"
export JWT_REFRESH_SECRET="your-refresh-secret"
export CORS_ORIGIN="https://yourdomain.com"
```

## Services

### App (Port 5000)
- Health check: GET /api/health
- Endpoints: /api/generate, /api/generations, /uploads
- Requires: PostgreSQL, Redis

### PostgreSQL (Port 5432)
- Image: postgres:15-alpine
- Volume: postgres_data (persistent)
- Healthcheck: pg_isready

### Redis (Port 6379)
- Image: redis:7-alpine
- Volume: redis_data (persistent)
- Healthcheck: redis-cli ping

### Adminer (Port 8080)
- Web-based database browser
- No credentials needed if on same network

## Best Practices Implemented

✅ Multi-stage builds for size optimization
✅ Non-root user (nodejs:1001)
✅ Layer caching optimization
✅ Health checks on all services
✅ Dependency isolation
✅ Security: no --legacy-peer-deps in prod, signed packages
✅ Logging driver configuration (10MB max, 3 files rotation)
✅ Named volumes for data persistence
✅ Custom bridge network (ai-network) for isolation
✅ Resource limits (commented, ready to uncomment)
✅ Proper shutdown signals (dumb-init in production)

## Common Commands

### Rebuild image
```bash
docker compose build --no-cache app
```

### Database migrations
```bash
docker compose exec app npm run db:migrate
```

### View logs
```bash
docker compose logs -f [service]
```

### Clean up
```bash
docker compose down -v  # Remove volumes too
docker system prune -a   # Clean unused images
```

## Environment Variables

See .env.example for all options. Key variables:

- `NODE_ENV`: development or production
- `JWT_SECRET`: Must be changed in production
- `DATABASE_URL`: Auto-generated from POSTGRES_* vars
- `REDIS_URL`: Auto-generated from redis service
- `CORS_ORIGIN`: Frontend URL
- `POLLINATIONS_ENABLED`: Free AI image provider (default: true)

## Next Steps

1. **Copy .env.example to .env** and customize for your environment
2. **Run `docker compose up`** to start development
3. **Access app at http://localhost:5000**
4. **View database at http://localhost:8080**
5. **For production**: Use docker-compose.production.yml with proper secrets in .env
