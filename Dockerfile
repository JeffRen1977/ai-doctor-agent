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

# Copy test server (no dependencies needed)
COPY test-server.js ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./frontend/dist

# Copy backend source code
COPY backend ./backend

# Copy package files for backend dependencies
COPY package*.json ./

# Install only production dependencies (for backend)
RUN npm ci --only=production

# Copy startup script (for debugging)
COPY start.sh ./

# Make startup script executable
RUN chmod +x start.sh

# Verify the final structure
RUN ls -la && echo "=== Final structure ===" && \
    ls -la frontend/ && echo "=== Frontend structure ===" && \
    ls -la backend/ && echo "=== Backend structure ==="

# Expose port
EXPOSE $PORT

# Start using npm start (which runs test-server.js)
CMD ["npm", "start"]
