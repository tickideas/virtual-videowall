# Database Seeding Fix for Production

## Problem

When running `npx prisma db seed` in the production Docker container, you get this error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'bcryptjs' imported from /app/prisma/seed.mjs
```

## Root Cause

The production Dockerfile uses **Next.js standalone build** which creates a minimal production bundle. This standalone output only includes packages needed for the Next.js server to run, not all dependencies from `package.json`.

The seed script (`prisma/seed.mjs`) requires `bcryptjs` to hash the admin password, but this package isn't included in the standalone output's minimal `node_modules`.

## Solutions

### Solution 1: Use `node` directly (Immediate Fix)

Instead of running:
```bash
npx prisma db seed
```

Run:
```bash
node prisma/seed.mjs
```

This works because:
- The `prisma/seed.mjs` file is copied to the container
- `@prisma/client` is available (standalone includes it)
- If `bcryptjs` is properly copied (see Solution 2), this will work

**Use this in your Coolify terminal:**
```bash
npx prisma db push    # Creates tables
node prisma/seed.mjs  # Seeds data
```

### Solution 2: Update Dockerfile (Permanent Fix)

The Dockerfile has been updated to copy the necessary `node_modules` for seeding:

```dockerfile
# Copy node_modules needed for seeding (bcryptjs and @prisma/client)
# The standalone build includes minimal dependencies, but we need bcryptjs for seeding
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@types ./node_modules/@types
```

**To apply this fix:**
1. Pull the latest code with the updated Dockerfile
2. Redeploy your application in Coolify
3. The new image will include `bcryptjs` in the container

### Solution 3: Seed Before Deployment (Best Practice)

For production, it's often better to seed the database **before** deploying the application:

```bash
# From your local machine or CI/CD
export DATABASE_URL="postgresql://user:password@your-server:5432/videowall?schema=public"
npm run db:push
npm run db:seed
```

This approach:
- ✅ Has all dependencies available
- ✅ Runs once, not on every deployment
- ✅ Can be part of your deployment pipeline
- ✅ Works even if production container has minimal dependencies

## Recommended Workflow

### Initial Setup (First Deployment)
1. Deploy PostgreSQL
2. Deploy application (with updated Dockerfile)
3. Run seeding from Coolify terminal:
   ```bash
   npx prisma db push
   node prisma/seed.mjs
   ```

### Subsequent Deployments
- Database schema is already set up
- Admin user already exists
- No need to seed again unless you want to add new sample data

### Adding New Data
- Add migration scripts or update seed script
- Run from local machine or CI/CD:
  ```bash
  export DATABASE_URL="postgresql://..."
  npm run db:push   # Apply schema changes
  npm run db:seed   # Add new data
  ```

## Files Changed

1. **Dockerfile** - Added bcryptjs to production image
2. **docs/COOLIFY_STANDALONE_DEPLOYMENT.md** - Updated seeding instructions
3. **docs/SEEDING_FIX.md** - This document

## Testing the Fix

After redeploying with the updated Dockerfile:

```bash
# In Coolify terminal
docker exec <container-id> ls node_modules/bcryptjs
# Should show: index.js  package.json  ...

docker exec <container-id> node prisma/seed.mjs
# Should output: 🌱 Seeding database...
#                ✅ Created admin user: admin@example.com
```

## Why This Approach?

**Why not just use full node_modules?**
- Standalone build is much smaller (faster deployments)
- Faster startup times
- Better security (fewer dependencies in production)
- Only adds what's needed for seeding (~1MB for bcryptjs)

**Why not seed during Docker build?**
- Database might not be available during build
- Seeding should be idempotent (can run multiple times)
- Allows flexibility to re-seed if needed

## Additional Notes

- The seed script is idempotent - it checks if admin exists before creating
- Admin credentials come from environment variables:
  - `ADMIN_EMAIL` (default: admin@example.com)
  - `ADMIN_PASSWORD` (default: admin123)
- **Always change the default password after first login!**

## Related Issues

- Next.js standalone output documentation: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Prisma seeding guide: https://www.prisma.io/docs/guides/database/seed-database
