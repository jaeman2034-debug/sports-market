# Quick Start Guide 🚀

## Get S-Market running in 5 minutes

This guide will help you set up and run the S-Market application locally for development.

---

## Prerequisites ✅

Before you begin, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** for cloning the repository
- **Firebase account** (free tier is sufficient)

---

## Step 1: Clone and Install 📥

```bash
# Clone the repository
git clone <repository-url>
cd s_market

# Install dependencies
npm install
```

---

## Step 2: Firebase Setup 🔥

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `s-market-dev`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Enable Firebase Services

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Click "Save"

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode"
   - Select your preferred location
   - Click "Done"

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"
   - Select location (same as Firestore)
   - Click "Done"

### Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add web app
4. Register app name: `s-market-web`
5. Copy the configuration object

---

## Step 3: Environment Configuration ⚙️

Create `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env
```

Edit `.env` with your Firebase configuration:

```env
# Required - Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional - Admin emails (comma-separated)
VITE_ADMIN_EMAILS=admin@example.com,your_email@example.com

# Optional - AI features (leave empty for now)
VITE_OPENAI_API_KEY=
VITE_KAKAO_API_KEY=
```

---

## Step 4: Firebase Security Rules 🔒

### Firestore Rules

1. Go to Firestore Database → Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are readable by all, writable by owner
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Notifications are readable/writable by the owner
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Chats are accessible by participants
    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid in resource.data.participants ||
         request.auth.uid == resource.data.buyerId ||
         request.auth.uid == resource.data.sellerId);
    }
  }
}
```

3. Click "Publish"

### Storage Rules

1. Go to Storage → Rules
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

---

## Step 5: Run the Application 🏃‍♂️

```bash
# Start development server
npm run dev
```

The application will be available at: **http://localhost:5173**

---

## Step 6: Test the Setup ✅

### Create Test Account

1. Open http://localhost:5173
2. Click "Login" or navigate to `/auth`
3. Click "Sign Up" tab
4. Enter email: `test@example.com`
5. Enter password: `test123`
6. Click "Sign Up"

### Test Product Upload

1. After logging in, go to `/product/upload`
2. Fill in:
   - Name: "Test Product"
   - Description: "This is a test product"
   - Price: "10000"
3. Upload an image (optional)
4. Click "Submit"

### Verify Firebase Data

1. Go to Firebase Console → Firestore Database
2. You should see:
   - `users` collection with your user
   - `products` collection with your test product

---

## Common Issues & Solutions 🔧

### Issue: "Firebase config not found"
**Solution**: Double-check your `.env` file has all required Firebase variables

### Issue: "Permission denied" in Firestore
**Solution**: Verify your Firestore rules are published correctly

### Issue: "Auth domain not authorized"
**Solution**: 
1. Go to Authentication → Settings → Authorized domains
2. Add `localhost` to the list

### Issue: Images not uploading
**Solution**: Check Storage rules are set to allow authenticated users

### Issue: Port already in use
**Solution**: 
```bash
# Use different port
npm run dev -- --port 3000
```

---

## Next Steps 🎯

Now that you have S-Market running:

### 1. Explore the Features
- Browse products at `/market`
- Create products at `/product/upload`
- Test chat functionality
- Check notifications

### 2. Development Setup
- Install VS Code extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Firebase

### 3. Optional Enhancements

#### Enable AI Features
1. Get OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env`: `VITE_OPENAI_API_KEY=your_key`
3. Test AI image analysis in product upload

#### Enable Location Features
1. Get Kakao Maps API key from [Kakao Developers](https://developers.kakao.com/)
2. Add to `.env`: `VITE_KAKAO_API_KEY=your_key`
3. Test GPS-based features

### 4. Production Deployment

#### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

#### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase init hosting
npm run build
firebase deploy
```

---

## Development Commands 📋

```bash
# Development
npm run dev          # Start dev server
npm run dev -- --port 3000  # Custom port

# Building
npm run build        # Production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues

# Firebase
firebase login       # Login to Firebase
firebase deploy      # Deploy to hosting
firebase serve       # Test locally with Firebase
```

---

## Project Structure Overview 📁

```
s_market/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/           # Utilities & Firebase config
│   ├── pages/         # Page components
│   └── App.tsx        # Main app component
├── docs/              # Documentation
├── public/            # Static assets
├── .env               # Environment variables
└── package.json       # Dependencies
```

---

## Documentation Quick Links 📚

- **[Complete API Documentation](./API_DOCUMENTATION.md)** - All APIs and functions
- **[Components Documentation](./COMPONENTS.md)** - React component guide
- **[Hooks & Utilities](./HOOKS_AND_UTILITIES.md)** - Custom hooks and utilities
- **[Types & Pages](./TYPES_AND_PAGES.md)** - TypeScript interfaces and pages
- **[Main README](./README.md)** - Complete project documentation

---

## Need Help? 🆘

1. **Check the console** - Most errors are logged there
2. **Review documentation** - Comprehensive guides available
3. **Check Firebase Console** - Verify data and rules
4. **Network tab** - Check API calls and responses

---

**🎉 Congratulations!** You now have S-Market running locally. Happy coding!