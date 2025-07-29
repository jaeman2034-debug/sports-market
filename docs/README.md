# S-Market Documentation 📚

## Complete API and Component Documentation

Welcome to the comprehensive documentation for S-Market, a React + TypeScript + Firebase sports equipment marketplace platform.

## 📋 Table of Contents

### Quick Start
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Setup](#️-environment-setup)
- [🏃‍♂️ Running the Application](#️-running-the-application)

### Documentation Sections
- [📖 API Documentation](#-api-documentation)
- [🧩 Components Documentation](#-components-documentation)
- [🪝 Hooks and Utilities](#-hooks-and-utilities)
- [📄 Types and Pages](#-types-and-pages)
- [🔗 Quick Reference](#-quick-reference)

### Features Overview
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🔒 Security](#-security)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore, Storage, and Auth enabled
- Google Vision API key (optional, for AI features)
- Kakao Maps API key (optional, for location features)

### Quick Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd s_market
npm install

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start development server
npm run dev
```

### 🌐 Live Demo
- **Development**: `http://localhost:5173`
- **Production**: [Deployed URL if available]

---

## ⚙️ Environment Setup

### Required Environment Variables

```env
# Admin Management
VITE_ADMIN_EMAILS=admin@example.com,your_email@example.com

# AI Features (Optional)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id_here

# Optional: Maps Integration
VITE_KAKAO_API_KEY=your_kakao_api_key_here
```

### Firebase Setup

1. **Create Firebase Project**: [Firebase Console](https://console.firebase.google.com/)
2. **Enable Services**:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
3. **Configure Security Rules**: Use provided `firestore.rules` and `storage.rules`
4. **Add Environment Variables**: Copy from Firebase project settings

---

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview build locally
```

### Deployment Options
```bash
# Firebase Hosting
firebase deploy

# Vercel
vercel

# Netlify
netlify deploy --prod --dir=dist
```

---

## 📖 API Documentation

**[📋 Complete API Documentation](./API_DOCUMENTATION.md)**

### Core APIs Overview

#### Authentication API
- `signUp(email, password)` - Create user account
- `signIn(email, password)` - User authentication
- `logOut()` - Sign out current user

#### Firebase Services
- `db` - Firestore database instance
- `storage` - Cloud Storage instance
- `auth` - Authentication instance

#### Notification System
- `createTransactionCompletedNotification()` - Transaction notifications
- `markNotificationAsRead()` - Mark notifications as read
- `getUnreadNotificationCount()` - Get unread count

#### AI/Vision Integration
- `analyzeImageBase64()` - Google Vision API integration

### Quick API Example
```typescript
import { signIn } from './lib/authFunctions';
import { createTransactionCompletedNotification } from './lib/notificationUtils';

// Authenticate user
const user = await signIn('user@example.com', 'password');

// Create notification
await createTransactionCompletedNotification(
  'product123',
  'Nike Shoes',
  'seller456',
  'seller@example.com'
);
```

---

## 🧩 Components Documentation

**[🎨 Complete Components Documentation](./COMPONENTS.md)**

### Component Categories

#### Layout Components
- `AppLayout` - Main application wrapper
- `Navigation` - Navigation bar with user status

#### Authentication
- `AuthForm` - Login/registration form
- `ProtectedRoute` - Route protection wrapper

#### Product Management
- `ProductForm` - Create/edit products with AI integration
- `ProductList` - Advanced product listing with GPS
- `ProductDetail` - Detailed product view

#### Chat System
- `ChatList` - User's conversations
- `ChatRoom` - Real-time messaging interface

#### Notifications
- `NotificationList` - Notification management
- `NotificationSnackbar` - Real-time popup notifications

#### Guards
- `AdminGuard` - Admin privilege protection
- `BlockGuard` - User blocking system

### Quick Component Example
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProductForm } from './components/ProductForm';

<Route path="/product/upload" element={
  <ProtectedRoute>
    <ProductForm />
  </ProtectedRoute>
} />
```

---

## 🪝 Hooks and Utilities

**[⚙️ Complete Hooks and Utilities Documentation](./HOOKS_AND_UTILITIES.md)**

### Custom React Hooks

#### `useUnreadNotifications()`
Real-time unread notification count tracking.

```typescript
const unreadCount = useUnreadNotifications();
// Returns: number (real-time count)
```

#### `useUserBlockStatus()`
Monitor if current user is blocked by admin.

```typescript
const isBlocked = useUserBlockStatus();
// Returns: boolean (true if blocked)
```

### Utility Functions

#### Authentication Utilities
```typescript
import { signUp, signIn, logOut } from './lib/authFunctions';
```

#### Notification Utilities
```typescript
import { 
  createTransactionCompletedNotification,
  markNotificationAsRead,
  getUnreadNotificationCount,
  createChatWithParticipants
} from './lib/notificationUtils';
```

#### AI/Vision Services
```typescript
import { analyzeImageBase64 } from './lib/vision';
```

---

## 📄 Types and Pages

**[📋 Complete Types and Pages Documentation](./TYPES_AND_PAGES.md)**

### TypeScript Interfaces

#### Core Data Models
```typescript
interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  imageBase64?: string;
  aiAnalysis?: string[];
  status?: "판매중" | "예약중" | "거래완료";
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  // ... more fields
}

interface Notification {
  id?: string;
  userId: string;
  message: string;
  productId: string;
  type: "거래완료" | "예약중" | "판매중";
  readAt?: any;
}
```

### Page Components

#### Main Pages
- `Home` - Landing page with app overview
- `MarketPage` - Main marketplace with filtering
- `MyPage` - User profile and settings
- `MyProductList` - User's product management

#### Routing Structure
```typescript
// Public routes
'/' -> Home
'/market' -> MarketPage
'/product/:id' -> ProductDetail

// Protected routes  
'/product/upload' -> ProductForm
'/mypage' -> MyPage
'/chat/:id' -> ChatRoom
```

---

## 🔗 Quick Reference

### Common Patterns

#### Firebase Operations
```typescript
// Add document
const docRef = await addDoc(collection(db, 'products'), productData);

// Real-time listener
const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
  const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// Query with filters
const q = query(
  collection(db, 'products'),
  where('status', '==', '판매중'),
  orderBy('createdAt', 'desc')
);
```

#### Authentication Checks
```typescript
// Check if user is authenticated
const [user, loading] = useAuthState(auth);

// Admin check
const isAdmin = user?.email && adminEmails.includes(user.email);

// Block status check
const isBlocked = useUserBlockStatus();
```

#### Route Protection
```typescript
<Route path="/protected" element={
  <ProtectedRoute>
    <ComponentThatRequiresAuth />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <AdminGuard>
    <AdminOnlyComponent />
  </AdminGuard>
} />
```

### Error Handling Pattern
```typescript
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await someAsyncFunction();
    setData(result);
  } catch (error) {
    console.error('Operation failed:', error);
    setError(error.message || 'Operation failed');
  } finally {
    setLoading(false);
  }
};
```

---

## ✨ Key Features

### 🔐 Authentication & Security
- Firebase Authentication with email/password
- Protected routes with automatic redirects
- Admin privilege system
- User blocking/unblocking functionality
- Secure environment variable management

### 📦 Product Management
- Advanced product creation with image upload
- AI-powered image analysis and categorization
- GPS-based location tagging
- Real-time product status updates
- Search and filtering capabilities

### 💬 Real-time Communication
- WebSocket-based chat system
- Real-time message delivery
- Image sharing in chats
- Unread message tracking
- Notification system integration

### 🤖 AI Integration
- Google Vision API for image analysis
- Automatic product categorization
- Price estimation based on AI analysis
- Brand and condition detection

### 📍 Location Services
- GPS-based distance calculation
- Location-aware product sorting
- Address resolution via Kakao Maps
- Privacy-respecting location sharing

### 🔔 Notification System
- Real-time notifications for transactions
- Push notification support
- Email notification integration
- Customizable notification preferences

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Firebase (Firestore, Storage, Auth)
- **Real-time**: Firebase real-time listeners
- **AI/ML**: Google Vision API, OpenAI GPT-4 Vision
- **Maps**: Kakao Maps API
- **Deployment**: Vercel, Netlify, Firebase Hosting

### Project Structure
```
src/
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── auth/           # Authentication components
│   ├── product/        # Product-related components
│   ├── chat/           # Chat system components
│   └── notification/   # Notification components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
├── pages/              # Page components
├── routes/             # Routing configuration
└── assets/             # Static assets
```

### Data Flow
1. **User Authentication**: Firebase Auth → React context
2. **Real-time Data**: Firestore listeners → React state
3. **Image Processing**: File upload → AI analysis → Storage
4. **Notifications**: Event triggers → Firestore → Real-time UI updates
5. **Location**: GPS API → Firestore → Distance calculations

---

## 🔒 Security

### Authentication Security
- Firebase Authentication handles password hashing
- Automatic session management
- Secure token-based authentication
- Protected route implementation

### Data Security
- Firestore security rules for data access control
- User-specific data isolation
- Admin privilege verification
- Input validation and sanitization

### API Security
- Environment variable protection
- API key management
- Rate limiting considerations
- Error handling without information leakage

### Privacy Protection
- Optional location sharing
- User data anonymization options
- GDPR compliance considerations
- User blocking and content moderation

---

## 📞 Support & Contributing

### Getting Help
- **Documentation Issues**: Check the specific documentation files
- **Code Issues**: Review the source code in `/src` directory
- **Feature Requests**: Submit issues with detailed descriptions

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint configuration provided
- Implement proper error handling
- Add JSDoc comments for public APIs
- Test components before committing

### File Organization
- **Components**: Group by feature/domain
- **Utilities**: Keep functions pure and testable
- **Types**: Define interfaces in relevant modules
- **Documentation**: Update docs with any API changes

---

## 📝 Documentation Files

| File | Description |
|------|-------------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference with examples |
| [COMPONENTS.md](./COMPONENTS.md) | React component documentation |
| [HOOKS_AND_UTILITIES.md](./HOOKS_AND_UTILITIES.md) | Custom hooks and utility functions |
| [TYPES_AND_PAGES.md](./TYPES_AND_PAGES.md) | TypeScript interfaces and page components |

---

*Last updated: December 2024*  
*For the most current information, always refer to the source code and individual documentation files.*