# Stage 1: Build
FROM node:18-alpine AS builder
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
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy startup script
COPY start-railway.js ./

# Copy dependencies and package files
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy backend source code
COPY backend ./backend

# Copy built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Railway will set PORT environment variable
EXPOSE $PORT
ENV HOSTNAME "0.0.0.0"

# Start using npm start (which runs start-railway.js)
CMD ["npm", "start"]