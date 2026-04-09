# Setup Instructions for Multi-Platform Support

## Quick Start

Follow these steps to set up the multi-platform support:

### 1. Update Environment Variables

Add the new platform URLs to your `.env` file:

```bash
# Existing variables
DATABASE_URL="your-database-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Platform API URLs (ADD THESE)
SILLOBITE_API_URL="http://localhost:5000"
FIGGY_API_URL="http://localhost:5001"
KOMATO_API_URL="http://localhost:5002"
```

### 2. Database Migration (Already Done ✓)

The migration has been applied successfully:
- Migration: `20260409192608_multi_platform_support`
- Prisma Client: Generated

If you need to run it again on another environment:
```bash
npx prisma migrate deploy
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test the Application

#### Test Platform Connection:
1. Navigate to `http://localhost:3000/connect`
2. Select a platform (Sillobite, Figgy, or Komato)
3. Enter email and connection code
4. Click "Connect"

#### Test Menu Fetching:
1. Go to `http://localhost:3000/profile`
2. Find the connected platform card
3. Click "Fetch Menu"
4. Verify menu data appears

## Platform API Requirements

Each platform must implement these endpoints:

### Authentication Endpoint
```
POST /api/auth/verify-code
Body: {
  "email": "user@example.com",
  "code": "123456"
}
Response: {
  "access_token": "token",
  "user_id": "user123"
}
```

### Menu Endpoint
```
POST /api/carebite/menu
Body: {
  "email": "user@example.com",
  "accessToken": "token"
}
Response: {
  "user": { ... },
  "canteens": [ ... ],
  "menuItems": [ ... ]
}
```

## Troubleshooting

### Migration Issues
If you encounter migration issues:
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

### TypeScript Errors
If you see TypeScript errors:
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart TypeScript server in your IDE
```

### Connection Issues
- Verify platform API URLs are correct in `.env`
- Check that platform APIs are running
- Verify network connectivity to platform APIs

### Menu Fetching Issues
- Ensure platform is connected first
- Check browser console for errors
- Verify API token is valid
- Check platform API logs

## Development Tips

### Testing with Mock APIs
If you don't have all platform APIs running, you can:
1. Point multiple platforms to the same API URL temporarily
2. Use a mock API server
3. Update platform URLs in `.env` as needed

### Debugging
Enable debug logging by checking:
- Browser console (F12)
- Server logs in terminal
- Network tab for API calls

### Adding More Platforms
To add a new platform:
1. Update `lib/platforms.ts`
2. Add environment variable
3. Update UI components
4. Test connection and menu fetching

## Production Deployment

Before deploying to production:

1. **Update Environment Variables** on your hosting platform
2. **Run Migrations** on production database:
   ```bash
   npx prisma migrate deploy
   ```
3. **Test All Platforms** in production environment
4. **Monitor Logs** for any issues
5. **Backup Database** before migration

## Support

For issues or questions:
- Check `MIGRATION_GUIDE.md` for detailed migration steps
- Review `PLATFORM_INTEGRATION.md` for technical details
- See `CHANGES_SUMMARY.md` for list of all changes
