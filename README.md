<div align="center">
  <img src="public/image.png" alt="CareBite Logo" width="120" height="120" />
  
  # 🍽️ CareBite
  
  ### Agentic Nutrition Engine
  
  *AI-powered nutrition management platform with automated meal planning and multi-platform ordering*
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.14-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Groq AI](https://img.shields.io/badge/Groq-AI-orange?style=for-the-badge)](https://groq.com/)
  
  [Features](#-features) • [Demo](#-demo) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation)
  
</div>

---

## 🎯 Overview

**CareBite** is a comprehensive nutrition management platform that automates the entire journey from personalized diet planning to meal ordering. Using advanced AI models, it generates customized meal plans based on user health profiles and automatically matches and orders meals from multiple food delivery platforms.

### The Problem
- Manual meal planning is time-consuming and complex
- Tracking macronutrients across multiple meals is difficult
- Ordering meals that match dietary requirements is tedious
- Maintaining consistency with fitness goals requires constant effort

### The Solution
CareBite automates the entire process:
1. **AI generates** personalized diet plans based on your profile
2. **Intelligent matching** finds meals that meet your nutritional needs
3. **Automated ordering** places orders at scheduled times
4. **Progress tracking** keeps you on track with your goals

---

## ✨ Features

### 🤖 AI-Powered Diet Generation
- Personalized meal plans using **Groq's Llama 3.3 70B** model
- Analyzes BMI, fitness goals, activity type, and medical conditions
- Generates 1-7 day plans with precise macronutrient targets
- Customized for weight loss, muscle gain, endurance, or general fitness

### 🔗 Multi-Platform Integration
- Connect to **3 food delivery platforms** (SilloBite, Figgy, Komato)
- Secure token-based authentication
- Real-time menu fetching
- Platform-specific menu caching

### 🎯 Intelligent Meal Matching
- AI analyzes available menu items against nutritional requirements
- Ensures all items from same restaurant and platform
- Respects dietary restrictions and medical conditions
- Provides match scores and explanations

### ⏰ Automated Ordering System
- Configure scheduling per meal (breakfast, lunch, dinner)
- Enable/disable specific days of the week
- Override individual scheduled orders
- Real-time menu fetching before each order
- Automatic order placement with confirmation

### 📱 Progressive Web App
- Install on mobile devices
- Offline capabilities
- Responsive mobile-first design
- Dark theme with glassmorphism UI
- Smooth animations with Framer Motion

### 🔐 Secure Authentication
- Google OAuth integration
- JWT session management
- Protected routes and API endpoints
- Secure token storage

### 📊 Progress Tracking
- View active diet plans
- Monitor upcoming scheduled orders
- Track order history
- Nutritional goal visualization

---

### Live Demo
🌐 **[Try CareBite Live](https://care-bites.vercel.app/)**
---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **PWA:** next-pwa configuration

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Session:** JWT

### AI/ML
- **Provider:** Groq
- **Model:** Llama 3.3 70B Versatile
- **Use Cases:** Diet generation, meal matching

### External APIs
- SilloBite API
- Figgy API
- Komato API

### Deployment
- **Platform:** Vercel
- **Database:** Neon (Serverless PostgreSQL)
- **Cron Jobs:** Vercel Cron

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (or Neon account)
- Google OAuth credentials
- Groq API key
- Food platform API access

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/steepanProjects/carebite
cd carebite
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@host/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Groq AI
GROQ_API_KEY="your-groq-api-key"

# Platform APIs
SILLOBITE_API_URL="http://localhost:5000"
FIGGY_API_URL="http://localhost:5001"
KOMATO_API_URL="http://localhost:5002"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Database Management
```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Create a migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

---

## 📖 Documentation

### Project Structure
```
carebite/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth handlers
│   │   ├── auto-order/   # Auto-order endpoints
│   │   ├── generate-diet/# Diet generation
│   │   ├── match-meals/  # Meal matching
│   │   └── ...
│   ├── dashboard/        # Dashboard page
│   ├── diet-plan/        # Diet plan page
│   ├── orders/           # Orders page
│   ├── auto-orders/      # Auto-orders page
│   └── ...
├── components/            # Reusable components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth config
│   ├── platforms.ts      # Platform configs
│   └── prisma.ts         # Prisma client
├── prisma/               # Database schema & migrations
├── public/               # Static assets
└── types/                # TypeScript types
```

### Key Files
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and data flow
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Complete project documentation
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Database migration guide
- **[TODO_CHECKLIST.md](TODO_CHECKLIST.md)** - Implementation checklist

### API Endpoints

#### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

#### Profile
- `GET /api/profile` - Fetch user profile
- `POST /api/profile` - Create/update profile

#### Platform Integration
- `POST /api/connect` - Connect to platform
- `GET /api/integration/status` - Get connection status
- `GET /api/menu?platform=X` - Fetch menu

#### Diet Planning
- `POST /api/generate-diet` - Generate AI diet plan
- `GET /api/generate-diet` - Get active diet plan

#### Ordering
- `POST /api/match-meals` - Match meals with menu
- `POST /api/create-order` - Place order

#### Auto-Ordering
- `GET/POST /api/auto-order/config` - Manage config
- `GET/POST /api/auto-order/schedule` - Manage schedule
- `POST /api/auto-order/place` - Place auto order
- `GET /api/auto-order/upcoming` - Get upcoming orders

---

## 🎓 How It Works

### 1. Onboarding
Users complete a 4-step onboarding process:
- **Step 1:** Basic info (age, height, weight)
- **Step 2:** Fitness goal (weight loss, muscle gain, endurance, general)
- **Step 3:** Activity type (gym, cycling, running, marathon, general)
- **Step 4:** Medical conditions and dietary restrictions

### 2. Platform Connection
Users connect to food delivery platforms:
- Select platform (SilloBite, Figgy, or Komato)
- Enter email and verification code
- System stores access token securely
- Can connect to multiple platforms simultaneously

### 3. Diet Plan Generation
AI generates personalized meal plans:
- Analyzes user profile and calculates BMI
- Determines calorie and macronutrient targets
- Generates 1-7 day meal plans
- Provides breakfast, lunch, and dinner for each day
- Includes strategy notes and recommendations

### 4. Manual Ordering
Users can manually order meals:
- Select day and meal from diet plan
- AI matches requirements with available menu items
- Review matched items and nutritional breakdown
- Place order with one click

### 5. Automated Ordering
Set it and forget it:
- Configure which meals to order (breakfast, lunch, dinner)
- Set times for each meal
- Enable/disable specific days of the week
- System automatically fetches menus, matches meals, and places orders
- Can override individual scheduled orders

---

## 🔧 Configuration

### Platform APIs
Each platform must implement:
- `POST /api/auth/verify-code` - Authentication endpoint
- `POST /api/carebite/menu` - Menu fetching endpoint

### Groq AI Configuration
The system uses two AI prompts:
1. **Diet Generation** - Creates personalized meal plans
2. **Meal Matching** - Matches requirements with menu items

### Automated Ordering
Configure via `AutoOrderConfig` model:
- Master enable/disable toggle
- Per-meal toggles (breakfast, lunch, dinner)
- Meal times (HH:MM format)
- Per-day toggles (Monday-Sunday)

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Complete onboarding flow
- [ ] Connect to all 3 platforms
- [ ] Generate diet plans (1, 3, 7 days)
- [ ] Match meals and place orders
- [ ] Configure auto-ordering
- [ ] Test scheduled order execution
- [ ] Test on mobile devices
- [ ] Test PWA installation

### Running Tests
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

---

## 🚢 Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables
- Deploy

3. **Set up Cron Jobs**
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/auto-order/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables
Set all variables from `.env.example` in Vercel dashboard.

### Database Migration
```bash
# Run migrations on production
npx prisma migrate deploy
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Update documentation as needed
- Test thoroughly before submitting PR

---

## 🔮 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication
- [x] Multi-platform integration
- [x] AI diet plan generation
- [x] Manual meal ordering
- [x] Automated ordering system

### Phase 2: Enhancements 🚧
- [ ] Token refresh mechanism
- [ ] Real-time menu updates via WebSocket
- [ ] Order history and analytics
- [ ] Nutritional progress dashboard
- [ ] Export diet plans as PDF

### Phase 3: Advanced Features 🎯
- [ ] Social features (meal sharing)
- [ ] AI-assisted recipe suggestions
- [ ] Computer vision for food recognition
- [ ] Collaborative meal planning
- [ ] Integration with fitness trackers
- [ ] Meal prep recommendations

### Phase 4: Scale 🚀
- [ ] Mobile native apps (iOS/Android)
- [ ] Support for 10+ food platforms
- [ ] Multi-language support
- [ ] Enterprise features for nutritionists
- [ ] API for third-party integrations

---

## 📊 Project Stats

- **Lines of Code:** ~15,000+
- **API Endpoints:** 15+
- **Database Models:** 9
- **AI Integrations:** 2
- **Platform Integrations:** 3
- **Development Time:** 2 months
- **Tech Stack Complexity:** High

---

## 🐛 Known Issues

- Menu data cached in localStorage (browser limits apply)
- No automatic token refresh (manual reconnection required)
- Cron job requires external service (Vercel Cron)
- AI rate limits may affect meal matching during peak times

See [TODO_CHECKLIST.md](TODO_CHECKLIST.md) for complete list.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Your Name**

- GitHub: [@steepanProjects](https://github.com/steepanProjects)
- LinkedIn: [Steepan P](https://www.linkedin.com/in/steepan)
- Email: steepan430@gmail.com

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Groq](https://groq.com/) - Fast AI inference
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Vercel](https://vercel.com/) - Deployment platform

---

## 📞 Support

If you have any questions or need help, please:
- Open an [issue](https://github.com/yourusername/carebite/issues)
- Start a [discussion](https://github.com/yourusername/carebite/discussions)
- Email: support@carebite.com

---

## ⭐ Show Your Support

If you found this project helpful, please give it a ⭐️!

---

<div align="center">
  
  **Built with ❤️ using Next.js, TypeScript, and AI**
  
  [⬆ Back to Top](#-carebite)
  
</div>
