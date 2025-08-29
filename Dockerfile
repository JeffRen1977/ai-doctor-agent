# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "Frontend build completed"

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./frontend/dist

# Copy backend source code
COPY backend ./backend

# Copy startup script
COPY start.sh ./start.sh

# Make startup script executable
RUN chmod +x start.sh

# Verify the final structure
RUN ls -la && echo "=== Final structure ===" && \
    ls -la frontend/ && echo "=== Frontend structure ===" && \
    ls -la backend/ && echo "=== Backend structure ==="

# Expose port
EXPOSE $PORT

# Start using the startup script
CMD ["./start.sh"]
