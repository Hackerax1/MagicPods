FROM node:20-alpine as builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for SvelteKit build
ENV VITE_SVELTEKIT_APP_ROOT=/app
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

# Copy built assets and necessary files
COPY --from=builder --chown=appuser:appgroup /app/build ./build
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules

# Switch to non-root user
USER appuser

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "build"]