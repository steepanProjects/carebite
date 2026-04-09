# Multi-Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Connect    │  │   Profile    │  │  Dashboard   │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│         │                  │                                 │
│  ┌──────▼──────────────────▼─────────────────────────┐      │
│  │         Component Layer                            │      │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │      │
│  │  │ ConnectCard  │  │  Platform Cards (x3)     │  │      │
│  │  │  - Platform  │  │  - Connection Status     │  │      │
│  │  │    Selector  │  │  - Fetch Menu Button     │  │      │
│  │  └──────────────┘  └──────────────────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP Requests
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Backend API                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/connect │  │  /api/menu   │  │/api/profile  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│  ┌──────▼──────────────────▼─────────────────────────┐      │
│  │           Platform Service Layer                   │      │
│  │  (lib/platforms.ts)                                │      │
│  │  ┌──────────────────────────────────────────────┐ │      │
│  │  │  verifyCode(platform, email, code)           │ │      │
│  │  │  getMenus(platform, accessToken)             │ │      │
│  │  │  getOrders(platform, accessToken)            │ │      │
│  │  └──────────────────────────────────────────────┘ │      │
│  └────────────────────────────────────────────────────┘      │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────┐      │
│  │         Database Layer (Prisma)                    │      │
│  │  ┌──────────────────────────────────────────────┐ │      │
│  │  │  UserIntegration Model                       │ │      │
│  │  │  - userId + platform (unique)                │ │      │
│  │  │  - platformUserId                            │ │      │
│  │  │  - accessToken                               │ │      │
│  │  └──────────────────────────────────────────────┘ │      │
│  └────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Platform API Calls
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   External Platform APIs                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Sillobite   │  │    Figgy     │  │   Komato     │      │
│  │   🍽️ API    │  │   🥗 API     │  │   🍅 API     │      │
│  │              │  │              │  │              │      │
│  │ :5000        │  │ :5001        │  │ :5002        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Connection Flow

```
User Selects Platform
        │
        ▼
Enter Email & Code
        │
        ▼
POST /api/connect
  { email, code, platform }
        │
        ▼
Platform Service
  verifyCode(platform, email, code)
        │
        ▼
External Platform API
  POST /api/auth/verify-code
        │
        ▼
Receive Access Token
        │
        ▼
Store in Database
  UserIntegration
  { userId, platform, accessToken }
        │
        ▼
Return Success to Frontend
```

### 2. Menu Fetching Flow

```
User Clicks "Fetch Menu"
        │
        ▼
GET /api/menu?platform=sillobite
        │
        ▼
Fetch User Integration
  WHERE userId = X AND platform = Y
        │
        ▼
External Platform API
  POST /api/carebite/menu
  { email, accessToken }
        │
        ▼
Receive Menu Data
        │
        ▼
Cache in localStorage
  Key: {platform}_menu
        │
        ▼
Display in UI
```

## Database Schema

```
┌─────────────────────────────────────────┐
│              User                        │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ email: String (Unique)                  │
│ name: String                            │
│ image: String                           │
└────────────┬────────────────────────────┘
             │ 1:N
             │
┌────────────▼────────────────────────────┐
│         UserIntegration                 │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ userId: String (FK)                     │
│ platform: String                        │
│ platformUserId: String                  │
│ accessToken: String                     │
│ connectedAt: DateTime                   │
│                                         │
│ UNIQUE(userId, platform)                │
└─────────────────────────────────────────┘
```

## Platform Configuration

```typescript
PLATFORMS = {
  sillobite: {
    name: 'sillobite',
    displayName: 'SilloBite',
    apiUrl: env.SILLOBITE_API_URL,
    icon: '🍽️'
  },
  figgy: {
    name: 'figgy',
    displayName: 'Figgy',
    apiUrl: env.FIGGY_API_URL,
    icon: '🥗'
  },
  komato: {
    name: 'komato',
    displayName: 'Komato',
    apiUrl: env.KOMATO_API_URL,
    icon: '🍅'
  }
}
```

## API Endpoints

### Connection
```
POST /api/connect
Request:
  {
    "email": "user@example.com",
    "code": "123456",
    "platform": "sillobite" | "figgy" | "komato"
  }
Response:
  {
    "success": true,
    "message": "Successfully connected to SilloBite",
    "data": {
      "access_token": "...",
      "user_id": "...",
      "platform": "sillobite"
    }
  }
```

### Menu Fetching
```
GET /api/menu?platform=sillobite
Response:
  {
    "success": true,
    "data": {
      "user": { ... },
      "canteens": [ ... ],
      "menuItems": [ ... ]
    },
    "platform": "sillobite"
  }
```

### Integration Status
```
GET /api/integration/status
Response:
  {
    "connected": true,
    "integrations": [
      {
        "platform": "sillobite",
        "connectedAt": "2024-01-01T00:00:00Z",
        "platformUserId": "123"
      },
      {
        "platform": "figgy",
        "connectedAt": "2024-01-02T00:00:00Z",
        "platformUserId": "456"
      }
    ]
  }
```

## State Management

### Frontend State
```typescript
// Profile Page State
{
  integrations: Integration[],      // All connected platforms
  menuData: Record<string, any>,    // Menu data per platform
  fetchingMenu: string | null,      // Currently fetching platform
  profile: UserProfile | null       // User profile data
}
```

### LocalStorage Cache
```
sillobite_menu: { user, canteens, menuItems }
figgy_menu: { user, canteens, menuItems }
komato_menu: { user, canteens, menuItems }
```

## Security Considerations

1. **Token Storage**
   - Access tokens stored in database (encrypted at rest)
   - Never exposed to frontend
   - Used only in backend API calls

2. **Authentication**
   - Each platform requires separate authentication
   - Tokens are platform-specific
   - No cross-platform token sharing

3. **API Proxying**
   - All platform API calls go through backend
   - Frontend never calls platform APIs directly
   - Prevents token exposure

4. **Data Isolation**
   - Each platform's data is isolated
   - Menu caches are separate
   - No data mixing between platforms

## Scalability

### Adding New Platforms
1. Add to `PLATFORMS` config
2. Add environment variable
3. Update UI components
4. No database changes needed

### Horizontal Scaling
- Stateless backend (can scale horizontally)
- Database handles concurrent connections
- Cache in localStorage (client-side)

### Performance
- Menu data cached locally
- Lazy loading of platform data
- Independent API calls per platform
