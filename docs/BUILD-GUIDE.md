# Build Guide 🔨

This guide explains how to build and run the Stock Analyzer project.

## 📋 Prerequisites

Before building, ensure you have:

1. ✅ **Node.js 20+** installed
2. ✅ **pnpm 8.15.0** installed (`npm install -g pnpm@8.15.0`)
3. ✅ **Docker Desktop** running
4. ✅ **Git** installed

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From project root
pnpm install
```

This will install dependencies for all workspaces (apps and packages).

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm dev:up

# Verify services are running
pnpm dev:ps
```

You should see both `stocks-postgres` and `stocks-redis` containers running.

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

When prompted for a migration name, you can use: `init`

### 4. Build All Packages

```bash
# Build everything in correct order
pnpm build
```

This builds:
1. `@stocks/shared` (contracts and schemas)
2. `@stocks/database` (Prisma client)
3. `apps/worker` (NestJS worker)

### 5. Start Worker

```bash
# Development mode with hot reload
pnpm dev:worker
```

You should see:
```
🚀 Worker service is running on: http://localhost:3001
📊 Health check: http://localhost:3001/health
```

### 6. Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-24T21:42:40.797Z",
  "service": "worker",
  "database": "connected"
}
```

## 🔧 Build Commands Reference

### Root Level Commands

```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm build:shared      # @stocks/shared
pnpm build:database    # @stocks/database
pnpm build:worker      # apps/worker

# Development mode
pnpm dev:worker        # Start worker with hot reload
pnpm dev:web          # Start web app (not yet implemented)

# Database commands
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database (not yet implemented)

# Docker commands
pnpm dev:up           # Start PostgreSQL + Redis
pnpm dev:down         # Stop all services
pnpm dev:logs         # View logs
pnpm dev:ps           # List running services

# Quality checks
pnpm typecheck        # Check TypeScript types
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting

# Cleanup
pnpm clean            # Remove all dist, node_modules, .next
```

### Package-Specific Commands

```bash
# Shared package
pnpm -C packages/shared build
pnpm -C packages/shared type-check

# Database package
pnpm -C packages/database build
pnpm -C packages/database prisma:generate
pnpm -C packages/database prisma:migrate
pnpm -C packages/database prisma:studio

# Worker app
pnpm -C apps/worker build
pnpm -C apps/worker dev
pnpm -C apps/worker start
```

## 📦 Build Order

**Important:** Packages must be built in this order due to dependencies:

1. **@stocks/shared** - Contains TypeScript contracts and Zod schemas
2. **@stocks/database** - Contains Prisma client (depends on shared)
3. **apps/worker** - NestJS application (depends on both)
4. **apps/web** - Next.js application (depends on both) - *Not yet implemented*

The root `pnpm build` command handles this automatically.

## 🐛 Troubleshooting

### Build Fails with "Cannot find module '@stocks/shared'"

**Cause:** Shared package not built  
**Solution:**
```bash
pnpm build:shared
```

### Build Fails with "Cannot use import statement outside a module"

**Cause:** Database package not built  
**Solution:**
```bash
pnpm build:database
```

### Worker Won't Start

**Cause:** Docker services not running  
**Solution:**
```bash
pnpm dev:up
pnpm dev:ps  # Verify services are healthy
```

### Database Connection Failed

**Cause:** PostgreSQL not ready or wrong credentials  
**Solution:**
```bash
# Check PostgreSQL logs
pnpm dev:logs

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Should be:
# DATABASE_URL="postgresql://stocks:stocks@localhost:5432/stocks?schema=public"
```

### Prisma Client Not Generated

**Cause:** Prisma generate not run  
**Solution:**
```bash
pnpm db:generate
```

### Port 3001 Already in Use

**Cause:** Another process using port 3001  
**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=3002
```

### TypeScript Errors After Changes

**Cause:** Stale build artifacts  
**Solution:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## 🔄 Development Workflow

### Making Changes to Shared Package

```bash
# 1. Make changes to packages/shared/src/*
# 2. Rebuild shared
pnpm build:shared

# 3. Restart worker (if running)
# Worker will auto-reload in dev mode
```

### Making Changes to Database Schema

```bash
# 1. Edit packages/database/prisma/schema.prisma
# 2. Create migration
pnpm db:migrate

# 3. Rebuild database package
pnpm build:database

# 4. Restart worker
```

### Making Changes to Worker

```bash
# Just save the file - hot reload will handle it!
# Worker runs with --watch flag in dev mode
```

## 📊 Build Output Locations

```
packages/shared/dist/          # Compiled TypeScript
packages/database/dist/        # Compiled TypeScript
packages/database/src/generated/client/  # Prisma client
apps/worker/dist/              # Compiled NestJS app
```

## 🎯 Production Build

For production deployment:

```bash
# Set environment
export NODE_ENV=production

# Build all
pnpm build

# Run migrations (don't use dev)
pnpm -C packages/database prisma:migrate:deploy

# Start worker (production mode)
cd apps/worker
node dist/main.js
```

## 📝 Build Performance Tips

1. **Incremental Builds**: TypeScript uses incremental compilation (tsconfig.tsbuildinfo)
2. **Parallel Builds**: pnpm runs builds in parallel when possible
3. **Skip Checks**: Use `--skip-lib-check` for faster builds (already configured)
4. **Watch Mode**: Use `pnpm dev:worker` for development (auto-rebuild on changes)

## 🔍 Verifying Build Success

After building, verify:

```bash
# Check all dist folders exist
ls packages/shared/dist
ls packages/database/dist
ls apps/worker/dist

# Check main entry points exist
ls packages/shared/dist/index.js
ls packages/database/dist/index.js
ls apps/worker/dist/main.js

# Verify Prisma client generated
ls packages/database/src/generated/client

# Check TypeScript compilation
pnpm typecheck
```

All commands should succeed without errors.

---

**Related Guides:**
- [Installation Guide](./installation-guide.md)
- [Project Status](./PROJECT-STATUS.md)
- [Baby Steps Roadmap](./baby-steps-roadmap.md)


