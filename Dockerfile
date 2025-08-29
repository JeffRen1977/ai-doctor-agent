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

# Copy dependencies and package files
COPY package.json package-lock.json ./
RUN npm install --only=production

# Copy backend source code
COPY backend ./backend

# Copy built frontend from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the backend server
CMD ["npm", "start"]