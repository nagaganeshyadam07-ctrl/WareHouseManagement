# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy server source code
COPY src ./src

# Build TypeScript to JavaScript in /dist
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# --- Production Image ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy production node_modules and built dist
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY src/database/schema.sql ./dist/database/schema.sql
COPY src/database/warehouse_dump.sql ./dist/database/warehouse_dump.sql

EXPOSE 3001

CMD ["node", "dist/index.js"]
