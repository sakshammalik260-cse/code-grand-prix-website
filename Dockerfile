# ==============================================================================
# CODE GRAND PRIX 2026 — PRODUCTION DOCKERFILE (MULTI-STAGE)
# ==============================================================================

# --- Stage 1: Build the Vite Frontend ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies with frozen lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and configurations
COPY . .

# Build for production
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: Serve with Nginx High-Performance Web Server ---
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built distribution from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
