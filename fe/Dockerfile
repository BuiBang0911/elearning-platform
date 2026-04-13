# ============================================
# Stage 1: Build React app
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# Accept build-time API URL
ARG VITE_API_BASE_URL=https://edumind-api.azurewebsites.net/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package files first for layer caching
COPY edumind/package.json edumind/package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY edumind/ .

# Build production bundle
RUN npm run build

# ============================================
# Stage 2: Serve with Nginx (minimal image)
# ============================================
FROM nginx:1.27-alpine AS final

# Add labels
LABEL maintainer="EduMind Team" \
      app="edumind-web" \
      version="1.0"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx runs on port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
