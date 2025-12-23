# Baby Step 5 - Build Configuration Fix

## Issue

The NestJS build is outputting to `dist/apps/worker/src/` instead of `dist/` due to TypeScript project references.

## Quick Fix (Choose One)

### Option A: Simplify Worker tsconfig (Recommended)

Edit `apps/worker/tsconfig.json` - replace everything with:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

Then rebuild:
```bash
cd c:\dev\stocks\apps\worker
Remove-Item -Recurse -Force dist
pnpm build
pnpm dev
```

### Option B: Update Start Script

Edit `apps/worker/package.json`:

```json
"scripts": {
  "dev": "node dist/apps/worker/src/main",
  "start": "node dist/apps/worker/src/main"
}
```

Then:
```bash
cd c:\dev\stocks
pnpm -C apps/worker build
pnpm -C apps/worker start
```

## Verification

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"...","service":"worker","database":"connected"}
```

---

**All code is complete and correct - just needs this build config adjustment!**

