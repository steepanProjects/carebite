# Diet Plan Generator - Setup Guide

## Features Implemented

✅ AI-powered diet plan generation using Groq's Llama 3.3 70B model
✅ Personalized based on user profile (age, weight, height, BMI, goals, medical conditions)
✅ Uses only available menu items from SilloBite
✅ Generates meal plans for custom number of days (1-30)
✅ Provides breakfast, lunch, dinner, and snacks with portions and calories
✅ Downloadable JSON format for future order placement
✅ Cached menu items from localStorage

## How to Use

### Step 1: Complete Your Profile
1. Go to Profile page
2. Make sure all your details are filled (age, height, weight, fitness goals, etc.)
3. Connect to SilloBite and fetch menu items

### Step 2: Generate Diet Plan
1. Go to Dashboard
2. Click "Generate Diet Plan"
3. Enter number of days (1-30)
4. Click "Generate Diet Plan"
5. Wait for AI to create your personalized plan

### Step 3: View and Download
1. Review your daily meal plans
2. Check calories and portions
3. Download JSON file for future orders

## API Endpoints

### POST /api/generate-diet
Generates personalized diet plan

**Request Body:**
```json
{
  "days": 7,
  "menuItems": [...]
}
```

**Response:**
```json
{
  "success": true,
  "dietPlan": {
    "dietPlan": [...],
    "summary": {...}
  },
  "userProfile": {...}
}
```

## Environment Variables Required

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Troubleshooting

### "No menu items found"
- Go to Profile page
- Click "Fetch Menu" button
- Menu will be cached in localStorage

### TypeScript Errors
- Stop dev server (Ctrl+C)
- Run: `npx prisma generate`
- Restart: `npm run dev`

### Diet Plan Not Generating
- Check Groq API key in .env
- Ensure profile is complete
- Check browser console for errors

## JSON Format for Orders

The generated diet plan JSON can be used to place orders:

```json
{
  "dietPlan": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "items": [
            {
              "name": "Dish Name",
              "portion": "1 serving",
              "calories": 300
            }
          ],
          "totalCalories": 300
        },
        ...
      },
      "dailyCalories": 2000
    }
  ]
}
```
