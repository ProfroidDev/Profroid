# BetterAuth Service Setup Guide

## Overview

This is a dedicated authentication microservice built with Node.js, Express, and BetterAuth. It handles all authentication operations for the Profroid application.

## Features

✅ User registration and login
✅ Email/password authentication
✅ Session management
✅ JWT-like token handling via BetterAuth
✅ User role management
✅ Account linking support
✅ Email verification ready
✅ Password reset ready

## Prerequisites

- Node.js 18+ (recommended 20+)
- PostgreSQL 12+ (or can use SQLite for development)
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
cd auth-service
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/profroid_auth"
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production"
TRUSTED_ORIGINS="http://localhost:5173,http://localhost:8080"
```

### 3. Setup Database

#### Option A: PostgreSQL (Recommended)

```bash
# Create database
createdb profroid_auth

# Or with docker
docker run --name postgres-auth -e POSTGRES_PASSWORD=password -e POSTGRES_DB=profroid_auth -p 5432:5432 -d postgres:16
```

#### Option B: SQLite (Development)

Change `DATABASE_URL` in `.env`:

```env
DATABASE_URL="file:./dev.db"
```

### 4. Push Database Schema

```bash
npm run db:push
```

Or create migrations:

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server will run at: `http://localhost:3000`

## API Endpoints

### Authentication Routes

All BetterAuth endpoints are available under `/api/auth/*`:

```
POST   /api/auth/sign-up          Register new user
POST   /api/auth/sign-in          User login
POST   /api/auth/sign-out         User logout
POST   /api/auth/session          Get current session
POST   /api/auth/verify-email     Verify email
POST   /api/auth/forgot-password  Initiate password reset
POST   /api/auth/reset-password   Reset password
GET    /api/auth/user             Get current user
```

### Custom Endpoints

```
GET    /health                     Health check
GET    /api/user                   Get current user (requires auth)
GET    /api/user/:id               Get user by ID (requires auth)
GET    /api/users                  List all users (admin only)
POST   /api/logout                 Logout current user
```

## Request/Response Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer {sessionToken}"
```

## Database Schema

The service uses Prisma ORM with the following models:

### User
- `id` - Unique identifier
- `email` - Unique email address
- `name` - Full name
- `firstName`, `lastName` - Name parts
- `password` - Hashed password
- `role` - User role (USER, ADMIN, TECHNICIAN, CUSTOMER)
- `image` - Profile picture URL
- `isActive` - Account status
- `emailVerified` - Email verification status
- `createdAt`, `updatedAt` - Timestamps

### Session
- `id` - Session ID
- `token` - Session token
- `expiresAt` - Expiration time
- `userId` - Link to user
- `ipAddress` - Client IP
- `userAgent` - Browser info

### Account (OAuth linking)
- Link to third-party providers (Google, GitHub, etc.)

### Verification
- Email verification tokens
- Password reset tokens

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3000 | Server port |
| NODE_ENV | No | development | Environment |
| DATABASE_URL | Yes | - | Database connection string |
| BETTER_AUTH_SECRET | Yes | - | Secret for token signing |
| BETTER_AUTH_URL | Yes | http://localhost:3000 | Base URL for auth service |
| TRUSTED_ORIGINS | No | See above | CORS allowed origins |

## Development Commands

```bash
# Start dev server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start

# Database commands
npm run db:push        # Push schema to database
npm run db:migrate     # Create migration
npm run db:studio      # Open Prisma Studio GUI
npm run db:reset       # Reset database (development only)
```

## Integration with Frontend

Update your frontend API client to use this service:

```typescript
// authApi.ts
const API_BASE_URL = "http://localhost:3000/api";

export const authApi = {
  register: (data) => axios.post(`${API_BASE_URL}/auth/sign-up`, data),
  login: (data) => axios.post(`${API_BASE_URL}/auth/sign-in`, data),
  logout: () => axios.post(`${API_BASE_URL}/auth/sign-out`),
  getSession: () => axios.get(`${API_BASE_URL}/auth/session`),
  getUser: () => axios.get(`${API_BASE_URL}/user`),
};
```

## Integration with Spring Boot

Your Spring Boot backend can call the auth service:

```java
// Validate token with auth service
RestTemplate restTemplate = new RestTemplate();
User user = restTemplate.getForObject(
  "http://localhost:3000/api/user",
  User.class,
  new HttpEntity<>(headers)
);
```

## Production Deployment

### Prerequisites
- PostgreSQL database
- Secure environment variables
- HTTPS/SSL certificate
- Proper CORS configuration

### Steps

1. **Build Docker image**:
```bash
docker build -t profroid-auth-service .
```

2. **Set production secrets**:
```bash
export BETTER_AUTH_SECRET="your-production-secret-32-chars-min"
```

3. **Deploy**:
```bash
docker run \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="your-secret" \
  -e NODE_ENV="production" \
  -p 3000:3000 \
  profroid-auth-service
```

## Troubleshooting

### Database connection error
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database exists: `psql -l`

### Port already in use
```bash
# Change PORT in .env or
lsof -i :3000  # Find process using port 3000
kill -9 <PID>  # Kill process
```

### Prisma issues
```bash
# Regenerate Prisma client
npx prisma generate

# Reset migrations
npm run db:reset
```

### CORS errors
- Add frontend URL to TRUSTED_ORIGINS in .env
- Restart server

## BetterAuth Documentation

Full documentation: https://better-auth.com

Key features:
- Built-in email/password auth
- Session management
- Account linking
- Email verification
- Password reset
- Admin panels
- Plugins system

## Next Steps

1. ✅ Install and run auth service
2. ✅ Test endpoints with curl/Postman
3. ✅ Update frontend API client
4. ✅ Configure Spring Boot to delegate auth
5. ✅ Deploy to production

## Support

For issues, check:
1. BetterAuth docs: https://better-auth.com
2. Prisma docs: https://www.prisma.io
3. Check error logs in console
