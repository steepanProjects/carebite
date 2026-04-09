# Multi-Platform Integration

CareBite now supports multiple food delivery platforms: Sillobite, Figgy, and Komato.

## Features

- Connect to multiple platforms simultaneously
- Each platform maintains its own API token
- Fetch menus independently from each platform
- Platform-specific caching for better performance
- Unified user interface for all platforms

## Supported Platforms

### 🍽️ Sillobite
- Default platform
- Full menu and ordering support

### 🥗 Figgy
- Alternative food delivery platform
- Same API structure as Sillobite

### 🍅 Komato
- Third platform option
- Compatible API endpoints

## Architecture

### Database Schema

```prisma
model UserIntegration {
  id              String   @id @default(cuid())
  userId          String
  platform        String   // 'sillobite', 'figgy', or 'komato'
  platformUserId  String
  accessToken     String
  connectedAt     DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id])

  @@unique([userId, platform])
}
```

### Platform Configuration

Platforms are configured in `lib/platforms.ts`:

```typescript
export const PLATFORMS = {
  sillobite: {
    name: 'sillobite',
    displayName: 'SilloBite',
    apiUrl: process.env.SILLOBITE_API_URL,
    icon: '🍽️',
  },
  figgy: {
    name: 'figgy',
    displayName: 'Figgy',
    apiUrl: process.env.FIGGY_API_URL,
    icon: '🥗',
  },
  komato: {
    name: 'komato',
    displayName: 'Komato',
    apiUrl: process.env.KOMATO_API_URL,
    icon: '🍅',
  },
};
```

## API Endpoints

### Connect to Platform
```
POST /api/connect
Body: {
  email: string,
  code: string,
  platform: 'sillobite' | 'figgy' | 'komato'
}
```

### Fetch Menu
```
GET /api/menu?platform=sillobite
```

### Get Integration Status
```
GET /api/integration/status
Response: {
  connected: boolean,
  integrations: [
    {
      platform: string,
      connectedAt: string,
      platformUserId: string
    }
  ]
}
```

## Usage

### Connecting to a Platform

1. Navigate to the Connect page (`/connect`)
2. Select the platform (Sillobite, Figgy, or Komato)
3. Enter your email and connection code
4. Click "Connect"

### Fetching Menus

1. Go to your Profile page (`/profile`)
2. Find the platform you want to fetch from
3. Click "Fetch Menu" button
4. Menu data is cached locally for quick access

### Managing Connections

- Each platform connection is independent
- You can connect/reconnect to any platform at any time
- Cached menu data can be cleared per platform
- All connections are shown on the profile page

## Environment Variables

Add these to your `.env` file:

```bash
SILLOBITE_API_URL="http://localhost:5000"
FIGGY_API_URL="http://localhost:5001"
KOMATO_API_URL="http://localhost:5002"
```

## Adding New Platforms

To add a new platform:

1. Add platform configuration to `lib/platforms.ts`:
```typescript
newplatform: {
  name: 'newplatform',
  displayName: 'New Platform',
  apiUrl: process.env.NEWPLATFORM_API_URL,
  icon: '🆕',
}
```

2. Add environment variable to `.env`:
```bash
NEWPLATFORM_API_URL="http://localhost:5003"
```

3. Update the platform list in `components/ConnectCard.tsx` and `app/profile/page.tsx`

4. The platform must support these API endpoints:
   - `POST /api/auth/verify-code` - Authentication
   - `POST /api/carebite/menu` - Menu fetching

## Technical Details

### Authentication Flow
1. User selects platform and enters credentials
2. Frontend sends request to `/api/connect` with platform identifier
3. Backend calls platform-specific verify endpoint
4. On success, stores access token with platform identifier
5. Token is used for subsequent API calls to that platform

### Menu Caching
- Each platform's menu is cached separately in localStorage
- Cache key format: `{platform}_menu`
- Example: `sillobite_menu`, `figgy_menu`, `komato_menu`

### API Token Management
- Tokens are stored in the database per user per platform
- Each platform connection is independent
- Reconnecting updates the existing token for that platform

## Security Considerations

- API tokens are stored securely in the database
- Each platform connection requires separate authentication
- Tokens are never exposed to the frontend
- All API calls are proxied through backend routes
