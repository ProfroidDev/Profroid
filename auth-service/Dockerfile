FROM node:20-bullseye-slim

WORKDIR /app

# Install OpenSSL (glibc) for Prisma engines
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate prisma client
RUN npm run prisma:generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Run migrations, seed database, and start application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]
