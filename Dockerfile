# ==========================================
# GENESIS ENGINE - Multi-stage Dockerfile
# ==========================================

# ==========================================
# Stage 1: Build Client
# ==========================================
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY client/ ./

# Build
RUN npm run build

# ==========================================
# Stage 2: Build Server
# ==========================================
FROM node:18-alpine AS server-builder

WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# ==========================================
# Stage 3: Production Image
# ==========================================
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata

# Create app directory
WORKDIR /app

# Copy server
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Copy client build
COPY --from=client-builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p uploads outputs

# Set environment
ENV NODE_ENV=production
ENV PORT=5000
ENV UPLOAD_DIR=/app/uploads
ENV OUTPUT_DIR=/app/outputs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command
CMD ["node", "server.js"]

# ==========================================
# Stage 4: Development Image (Optional)
# ==========================================
FROM node:18-alpine AS development

WORKDIR /app

# Install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose ports
EXPOSE 5000
EXPOSE 5173

# Start in development mode
CMD ["npm", "run", "dev"]
