# Multi-Platform Migration Guide

This guide will help you migrate from single platform (Sillobite) to multi-platform support (Sillobite, Figgy, Komato).

## Database Migration

The database schema has been updated to support multiple platform integrations per user.

### Changes Made:
1. `UserIntegration` model now supports multiple platforms per user
2. Added `platform` field to identify which platform (sillobite, figgy, komato)
3. Changed `sillobiteUserId` to `platformUserId` for generic platform user ID
4. Added unique constraint on `userId` + `platform` combination

### Migration Steps:

1. **Update your environment variables** in `.env`:
   ```bash
   # Add these new platform URLs
   FIGGY_API_URL="http://localhost:5001"
   KOMATO_API_URL="http://localhost:5002"
   ```

2. **Run Prisma migration**:
   ```bash
   npx prisma migrate dev --name multi_platform_support
   ```

   This will:
   - Modify the `UserIntegration` table structure
   - Migrate existing Sillobite connections to the new schema
   - Add the platform field with 'sillobite' as default for existing records

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## API Changes

### New Endpoints:
- `/api/connect` - Generic connection endpoint (replaces `/api/connect-sillobite`)
  - Accepts `platform` parameter: 'sillobite', 'figgy', or 'komato'
  
### Updated Endpoints:
- `/api/menu` - Now accepts `platform` query parameter
  - Example: `/api/menu?platform=figgy`
  - Defaults to 'sillobite' if not specified

- `/api/integration/status` - Now returns array of integrations
  - Returns all connected platforms for the user

### Deprecated Endpoints:
- `/api/connect-sillobite` - Still works but use `/api/connect` instead

## Frontend Changes

### ConnectCard Component:
- Now includes platform selector (Sillobite, Figgy, Komato)
- Users can choose which platform to connect

### Profile Page:
- Shows all platform connections in separate cards
- Each platform has its own "Connect" and "Fetch Menu" buttons
- Menu data is cached separately per platform
- Platform-specific icons and branding

## Platform Configuration

Each platform uses the same API structure:
- `/api/auth/verify-code` - For authentication
- `/api/carebite/menu` - For fetching menus

Configure platform URLs in your `.env` file:
```bash
SILLOBITE_API_URL="http://localhost:5000"
FIGGY_API_URL="http://localhost:5001"
KOMATO_API_URL="http://localhost:5002"
```

## Testing

1. **Test existing Sillobite connections**:
   - Existing users should still see their Sillobite connection
   - They can fetch menus as before

2. **Test new platform connections**:
   - Go to `/connect` page
   - Select Figgy or Komato
   - Enter credentials and connect
   - Verify connection appears on profile page

3. **Test menu fetching**:
   - Each platform should fetch its own menu independently
   - Menus are cached separately in localStorage

## Rollback Plan

If you need to rollback:

1. Revert the Prisma schema changes
2. Run: `npx prisma migrate dev --name rollback_multi_platform`
3. Restore the old API files from git history
4. Remove new environment variables

## Notes

- All platforms use the same authentication flow (email + code)
- API tokens are stored separately per platform
- Users can connect to multiple platforms simultaneously
- Each platform's menu data is cached independently
