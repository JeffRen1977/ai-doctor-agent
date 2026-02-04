# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy all necessary files
COPY package.json package-lock.json ./
COPY vite.config.ts tsconfig.json tsconfig.node.json index.html ./
COPY frontend ./frontend
COPY backend ./backend

# Install all dependencies
RUN npm install

# Build the frontend
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy startup script (keep scripts directory structure)
COPY scripts/start-railway.js ./scripts/start-railway.js

# Copy dependencies and package files
COPY package.json package-lock.json ./

# Install production dependencies (using npm install for better compatibility)
RUN npm install --omit=dev

# Copy backend source code
COPY backend ./backend

# Copy built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Verify files are copied correctly
RUN echo "=== BUILD VERIFICATION ===" && \
    echo "Current directory:" && pwd && \
    echo "Root contents:" && ls -la && \
    echo "Backend contents:" && ls -la backend/ && \
    echo "Backend/src contents:" && ls -la backend/src/ && \
    echo "Dist contents:" && ls -la dist/ && \
    echo "Package.json exists:" && test -f package.json && echo "YES" || echo "NO" && \
    echo "Start script exists:" && test -f scripts/start-railway.js && echo "YES" || echo "NO" && \
    echo "Backend index exists:" && test -f backend/src/index.js && echo "YES" || echo "NO" && \
    echo "Dist index exists:" && test -f dist/index.html && echo "YES" || echo "NO"

# Railway will set PORT environment variable
EXPOSE $PORT
ENV HOSTNAME "0.0.0.0"

# Start using npm start (which runs start-railway.js)
CMD ["npm", "start"]