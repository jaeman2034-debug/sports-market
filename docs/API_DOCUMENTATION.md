# S-Market API Documentation 📚

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Firebase Configuration](#firebase-configuration)  
3. [Notification System](#notification-system)
4. [AI Vision API](#ai-vision-api)
5. [Custom React Hooks](#custom-react-hooks)
6. [React Components](#react-components)
7. [Route Guards](#route-guards)
8. [Page Components](#page-components)
9. [TypeScript Interfaces](#typescript-interfaces)
10. [Examples & Usage](#examples--usage)

---

## Authentication API

### `authFunctions.ts`

Contains authentication functions for user registration, login, and logout.

#### `signUp(email: string, password: string)`
Creates a new user account with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** Promise<UserCredential>

**Example:**
```typescript
import { signUp } from '../lib/authFunctions';

try {
  const userCredential = await signUp('user@example.com', 'password123');
  console.log('User created:', userCredential.user);
} catch (error) {
  console.error('Sign up failed:', error);
}
```

#### `signIn(email: string, password: string)`
Signs in an existing user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** Promise<UserCredential>

**Example:**
```typescript
import { signIn } from '../lib/authFunctions';

try {
  const userCredential = await signIn('user@example.com', 'password123');
  console.log('User signed in:', userCredential.user);
} catch (error) {
  console.error('Sign in failed:', error);
}
```

#### `logOut()`
Signs out the current user.

**Parameters:** None

**Returns:** Promise<void>

**Example:**
```typescript
import { logOut } from '../lib/authFunctions';

try {
  await logOut();
  console.log('User signed out successfully');
} catch (error) {
  console.error('Sign out failed:', error);
}
```

---

## Firebase Configuration

### `firebaseConfig.ts`

Firebase initialization and service exports.

#### Exported Services

- `db`: Firestore database instance
- `storage`: Firebase Storage instance  
- `auth`: Firebase Authentication instance
- `app`: Firebase app instance (default export)

**Example:**
```typescript
import { db, storage, auth } from '../lib/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Use Firestore
const docRef = await addDoc(collection(db, 'products'), {
  name: 'Sample Product',
  price: 100
});

// Use Auth
const user = auth.currentUser;
```

---

## Notification System

### `notificationUtils.ts`

Utilities for managing notifications and chat system.

#### Types

```typescript
interface Notification {
  id?: string;
  userId: string;          // 알림 대상자
  message: string;         // 알림 내용
  createdAt: any;          // 생성 시간
  productId: string;       // 관련 상품 ID
  type: "거래완료" | "예약중" | "판매중";  // 알림 유형
  readAt?: any;            // 읽음 여부
}
```

#### `createTransactionCompletedNotification(productId, productName, sellerId, sellerEmail)`

Creates notifications when a transaction is completed.

**Parameters:**
- `productId` (string): Product ID
- `productName` (string): Product name
- `sellerId` (string): Seller's user ID
- `sellerEmail` (string): Seller's email

**Returns:** Promise<void>

**Example:**
```typescript
import { createTransactionCompletedNotification } from '../lib/notificationUtils';

await createTransactionCompletedNotification(
  'product123',
  'Nike Running Shoes',
  'seller456',
  'seller@example.com'
);
```

#### `markNotificationAsRead(notificationId)`

Marks a notification as read.

**Parameters:**
- `notificationId` (string): Notification document ID

**Returns:** Promise<void>

**Example:**
```typescript
import { markNotificationAsRead } from '../lib/notificationUtils';

await markNotificationAsRead('notification123');
```

#### `getUnreadNotificationCount(userId)`

Gets the count of unread notifications for a user.

**Parameters:**
- `userId` (string): User ID

**Returns:** Promise<number>

**Example:**
```typescript
import { getUnreadNotificationCount } from '../lib/notificationUtils';

const count = await getUnreadNotificationCount('user123');
console.log(`You have ${count} unread notifications`);
```

#### `createChatWithParticipants(buyerId, sellerId, productId, productName)`

Creates a chat room with participants array for transaction.

**Parameters:**
- `buyerId` (string): Buyer's user ID
- `sellerId` (string): Seller's user ID  
- `productId` (string): Product ID
- `productName` (string): Product name

**Returns:** Promise<string> - Chat room ID

**Example:**
```typescript
import { createChatWithParticipants } from '../lib/notificationUtils';

const chatId = await createChatWithParticipants(
  'buyer123',
  'seller456', 
  'product789',
  'Sports Equipment'
);
```

---

## AI Vision API

### `vision.ts`

Google Vision API integration for image analysis.

#### `analyzeImageBase64(base64, apiKey)`

Analyzes an image using Google Vision API to extract labels.

**Parameters:**
- `base64` (string): Base64 encoded image data
- `apiKey` (string): Google Vision API key

**Returns:** Promise<string[]> - Array of detected labels

**Example:**
```typescript
import { analyzeImageBase64 } from '../lib/vision';

const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...';
const apiKey = 'your-vision-api-key';

try {
  const labels = await analyzeImageBase64(base64Image, apiKey);
  console.log('Detected labels:', labels);
  // Output: ['Sports equipment', 'Football', 'Athletic gear']
} catch (error) {
  console.error('Vision API error:', error);
}
```

---

## Custom React Hooks

### `useUnreadNotifications()`

Hook for tracking unread notifications count in real-time.

**Parameters:** None

**Returns:** number - Count of unread notifications

**Example:**
```typescript
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

function NotificationBadge() {
  const unreadCount = useUnreadNotifications();
  
  return (
    <div>
      Notifications {unreadCount > 0 && <span>({unreadCount})</span>}
    </div>
  );
}
```

### `useUserBlockStatus()`

Hook for checking if the current user is blocked.

**Parameters:** None

**Returns:** boolean - True if user is blocked

**Example:**
```typescript
import { useUserBlockStatus } from '../hooks/useUserBlockStatus';

function UserComponent() {
  const isBlocked = useUserBlockStatus();
  
  if (isBlocked) {
    return <div>Your account has been blocked.</div>;
  }
  
  return <div>Welcome to the app!</div>;
}
```

---

## React Components

### Route Guards

#### `ProtectedRoute`

Protects routes that require authentication.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Example:**
```typescript
import ProtectedRoute from '../components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

#### `AdminGuard`

Protects routes that require admin privileges.

**Props:**
```typescript
interface AdminGuardProps {
  children: React.ReactNode;
}
```

**Example:**
```typescript
import AdminGuard from '../components/AdminGuard';

<Route path="/admin" element={
  <AdminGuard>
    <AdminPanel />
  </AdminGuard>
} />
```

#### `BlockGuard`

Automatically redirects blocked users and signs them out.

**Props:** None

**Example:**
```typescript
import BlockGuard from '../components/BlockGuard';

function App() {
  return (
    <>
      <BlockGuard />
      {/* Rest of your app */}
    </>
  );
}
```

### Layout Components

#### `AppLayout`

Main application layout wrapper with navigation and notifications.

**Props:**
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

**Features:**
- Dark theme styling (`#0a0a0a` background)
- Navigation component integration
- Real-time notification snackbars
- Chat message snackbars
- Block guard integration

**Example:**
```typescript
import AppLayout from '../components/AppLayout';

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Your routes */}
      </Routes>
    </AppLayout>
  );
}
```

### Product Components

#### `ProductForm`

Form component for creating and editing products.

**Features:**
- Image upload with compression
- AI-powered image analysis integration
- GPS location capture
- Form validation
- Real-time preview

**Example:**
```typescript
import ProductForm from '../components/ProductForm';

<Route path="/product/upload" element={
  <ProtectedRoute>
    <ProductForm />
  </ProtectedRoute>
} />
```

#### `ProductList`

Displays a list of products with filtering and sorting.

**Features:**
- Search functionality
- Sort by latest, price, distance
- GPS-based distance calculation
- Admin controls (delete all products)
- Real-time updates

**Example:**
```typescript
import ProductList from '../components/ProductList';

function MarketPage() {
  return <ProductList />;
}
```

#### `ProductDetail`

Displays detailed product information with purchase/chat options.

**Features:**
- Full product information display
- Image gallery
- Purchase/reservation functionality
- Chat initiation
- Seller contact information

### Chat Components

#### `ChatList`

Displays list of user's chat conversations.

**Features:**
- Real-time chat updates
- Unread message indicators
- Product context display
- Navigation to individual chats

#### `ChatRoom`

Individual chat conversation interface.

**Features:**
- Real-time messaging
- Message history
- Image sharing
- Product context
- Transaction completion

### Notification Components

#### `NotificationList`

Displays user's notifications with read/unread status.

**Features:**
- Real-time notification updates
- Mark as read functionality
- Notification filtering
- Product navigation links

#### `NotificationSnackbar`

Popup notifications for real-time events.

**Features:**
- Auto-dismiss functionality
- Multiple notification queue
- Non-intrusive display
- Click-to-navigate

#### `ChatMessageSnackbar`

Popup notifications for new chat messages.

**Features:**
- Real-time message alerts
- Chat navigation
- Auto-dismiss
- Sound notifications (optional)

---

## Page Components

### `Home`

Landing page component with app overview and navigation.

### `MarketPage`

Main marketplace page displaying products with advanced filtering.

### `MyPage`

User profile and account management page.

### `MyProductList`

User's own products management interface.

---

## TypeScript Interfaces

### Product Interface

```typescript
interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  imageUrl?: string;
  imageBase64?: string;
  aiAnalysis?: string[];
  aiRecommendedPrice?: number;
  aiCategory?: string;
  aiBrand?: string;
  aiCondition?: string;
  priceSatisfaction?: "satisfied" | "disappointed";
  sellerId?: string;
  sellerEmail?: string;
  status?: "판매중" | "예약중" | "거래완료";
  createdAt?: { seconds: number };
  image?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}
```

### Notification Interface

```typescript
interface Notification {
  id?: string;
  userId: string;
  message: string;
  createdAt: any;
  productId: string;
  type: "거래완료" | "예약중" | "판매중";
  readAt?: any;
}
```

---

## Examples & Usage

### Complete Product Creation Flow

```typescript
import { ProductForm } from '../components/ProductForm';
import { ProtectedRoute } from '../components/ProtectedRoute';

// 1. Route setup
<Route path="/product/upload" element={
  <ProtectedRoute>
    <ProductForm />
  </ProtectedRoute>
} />

// 2. The ProductForm handles:
// - Image upload and compression
// - AI analysis (optional)
// - GPS location capture
// - Form validation
// - Database storage
```

### Real-time Notification System

```typescript
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { NotificationSnackbar } from '../components/NotificationSnackbar';

function App() {
  const unreadCount = useUnreadNotifications();
  
  return (
    <div>
      <NavigationBadge count={unreadCount} />
      <NotificationSnackbar />
      {/* Other components */}
    </div>
  );
}
```

### Admin Panel Implementation

```typescript
import { AdminGuard } from '../components/AdminGuard';

function AdminPanel() {
  const isAdmin = () => {
    // Admin check logic is handled by AdminGuard
    return true; // This code only runs for admins
  };

  return (
    <AdminGuard>
      <div>
        <h1>Admin Panel</h1>
        <button onClick={deleteAllProducts}>Delete All Products</button>
        {/* Other admin features */}
      </div>
    </AdminGuard>
  );
}
```

### Chat System Integration

```typescript
import { createChatWithParticipants } from '../lib/notificationUtils';
import { ChatRoom } from '../components/ChatRoom';

// Create chat when user wants to contact seller
const handleContactSeller = async (productId, productName, sellerId) => {
  const buyerId = auth.currentUser?.uid;
  if (!buyerId) return;
  
  const chatId = await createChatWithParticipants(
    buyerId,
    sellerId,
    productId,
    productName
  );
  
  navigate(`/chat/${chatId}`);
};
```

---

## Environment Variables

Required environment variables for full functionality:

```env
# Admin Management
VITE_ADMIN_EMAILS=admin@example.com,your_email@example.com

# AI Features
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id_here

# Optional: Maps Integration
VITE_KAKAO_API_KEY=your_kakao_api_key_here
```

---

## Error Handling

All API functions include comprehensive error handling:

```typescript
// Example error handling pattern
try {
  const result = await apiFunction();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error (show user message, retry, etc.)
}
```

## Performance Considerations

- Images are compressed to 15KB or less for optimal loading
- Real-time listeners are properly cleaned up
- GPS requests include timeout and fallback handling
- Large lists use pagination where appropriate

## Security Features

- Route protection with authentication
- Admin privilege checking
- User blocking system
- Input validation and sanitization
- Firestore security rules enforcement

---

*For more detailed implementation examples, see the individual component files in the `/src` directory.*