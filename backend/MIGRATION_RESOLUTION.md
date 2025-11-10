# Resolving Failed Migration Issue

## Problem
The migration `20251109183716_add_location_sharing_enabled` is marked as failed in the database, preventing new migrations from being applied.

## Solution

You need to resolve the failed migration first. There are two scenarios:

### Scenario 1: Column Already Exists (Migration Partially Applied)
If the `locationSharingEnabled` column already exists in the `users` table, mark the migration as applied:

```bash
cd backend
npx prisma migrate resolve --applied 20251109183716_add_location_sharing_enabled
```

### Scenario 2: Column Doesn't Exist (Migration Failed Before Applying)
If the `locationSharingEnabled` column doesn't exist, mark the migration as rolled back:

```bash
cd backend
npx prisma migrate resolve --rolled-back 20251109183716_add_location_sharing_enabled
```

Then apply the migration:

```bash
npx prisma migrate deploy
```

## For Render Deployment

If you're deploying on Render, you can add a build command that resolves this automatically:

1. **Check if column exists** (you can do this via Render's database console or add it to your build script)
2. **Resolve the migration** using one of the commands above
3. **Then run** `npx prisma migrate deploy`

### Alternative: Add to Build Script

You can modify your build process to automatically resolve this. However, be careful as this requires database access during build.

## Verification

After resolving, verify the migration status:

```bash
npx prisma migrate status
```

All migrations should show as applied.

