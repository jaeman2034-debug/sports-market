# Hooks and Utilities Documentation 🪝⚙️

## Table of Contents

1. [Custom React Hooks](#custom-react-hooks)
2. [Utility Functions](#utility-functions)
3. [Firebase Integration](#firebase-integration)
4. [AI/Vision Services](#aivision-services)
5. [Notification System](#notification-system)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

---

## Custom React Hooks

### `useUnreadNotifications()`
**File:** `src/hooks/useUnreadNotifications.ts`

Real-time hook for tracking unread notification count for the authenticated user.

#### Signature
```typescript
function useUnreadNotifications(): number
```

#### Parameters
None

#### Returns
- `count` (number): Real-time count of unread notifications

#### Features
- **Real-time Updates**: Uses Firestore `onSnapshot` for live updates
- **Authentication Aware**: Automatically handles user login/logout
- **Error Handling**: Gracefully handles connection errors
- **Cleanup**: Properly unsubscribes from listeners on unmount

#### Implementation Details
```typescript
// Firestore query used internally:
query(
  collection(db, "notifications"),
  where("userId", "==", user.uid),
  where("readAt", "==", null)
)
```

#### Usage Example
```typescript
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

function NotificationBadge() {
  const unreadCount = useUnreadNotifications();
  
  return (
    <div className="notification-badge">
      <span>🔔</span>
      {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
      )}
    </div>
  );
}

// Example with conditional rendering
function NavigationMenu() {
  const unreadCount = useUnreadNotifications();
  
  return (
    <nav>
      <Link to="/notifications">
        Notifications
        {unreadCount > 0 ? ` (${unreadCount})` : ''}
      </Link>
    </nav>
  );
}
```

#### Error Handling
```typescript
// The hook handles errors by:
// 1. Logging errors to console
// 2. Setting count to 0 on error
// 3. Continuing to monitor for recovery
```

### `useUserBlockStatus()`
**File:** `src/hooks/useUserBlockStatus.ts`

Hook for monitoring if the current user has been blocked by administrators.

#### Signature
```typescript
function useUserBlockStatus(): boolean
```

#### Parameters
None

#### Returns
- `isBlocked` (boolean): True if user is blocked, false otherwise

#### Features
- **Real-time Monitoring**: Watches user document for block status changes
- **Authentication Integration**: Works with Firebase Auth state
- **Automatic Cleanup**: Unsubscribes on component unmount
- **Fallback Handling**: Returns false for unauthenticated users

#### Implementation Details
```typescript
// Firestore document structure:
// /users/{userId} -> { blocked: boolean }

// The hook checks:
// 1. User authentication state
// 2. User document existence
// 3. blocked field value
```

#### Usage Example
```typescript
import { useUserBlockStatus } from '../hooks/useUserBlockStatus';

function UserDashboard() {
  const isBlocked = useUserBlockStatus();
  
  if (isBlocked) {
    return (
      <div className="blocked-message">
        <h1>Account Blocked</h1>
        <p>Your account has been temporarily blocked. Please contact support.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Welcome to your dashboard!</h1>
      {/* Normal dashboard content */}
    </div>
  );
}

// Example with redirect
function ProtectedComponent() {
  const isBlocked = useUserBlockStatus();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isBlocked) {
      navigate('/blocked', { replace: true });
    }
  }, [isBlocked, navigate]);
  
  return isBlocked ? null : <MainComponent />;
}
```

#### Integration with BlockGuard
```typescript
// BlockGuard component uses this hook internally
// to automatically sign out blocked users
function BlockGuard() {
  const isBlocked = useUserBlockStatus();
  
  useEffect(() => {
    if (isBlocked) {
      auth.signOut();
      navigate('/blocked');
    }
  }, [isBlocked]);
  
  return null;
}
```

---

## Utility Functions

### Authentication Functions
**File:** `src/lib/authFunctions.ts`

Core authentication utilities for user management.

#### `signUp(email: string, password: string)`

Creates a new user account with email and password.

```typescript
function signUp(email: string, password: string): Promise<UserCredential>
```

**Parameters:**
- `email` (string): Valid email address
- `password` (string): Password (Firebase enforces minimum 6 characters)

**Returns:** Promise<UserCredential>

**Throws:** FirebaseError with specific error codes

**Usage Example:**
```typescript
import { signUp } from '../lib/authFunctions';

async function handleRegistration(formData) {
  try {
    const userCredential = await signUp(formData.email, formData.password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      createdAt: serverTimestamp(),
      blocked: false
    });
    
    console.log('User registered successfully:', user.uid);
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setError('This email is already registered');
        break;
      case 'auth/weak-password':
        setError('Password should be at least 6 characters');
        break;
      case 'auth/invalid-email':
        setError('Please enter a valid email address');
        break;
      default:
        setError('Registration failed. Please try again.');
    }
  }
}
```

#### `signIn(email: string, password: string)`

Authenticates an existing user with email and password.

```typescript
function signIn(email: string, password: string): Promise<UserCredential>
```

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:** Promise<UserCredential>

**Usage Example:**
```typescript
import { signIn } from '../lib/authFunctions';

async function handleLogin(formData) {
  try {
    const userCredential = await signIn(formData.email, formData.password);
    const user = userCredential.user;
    
    // Check if user is blocked
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.data()?.blocked) {
      await auth.signOut();
      throw new Error('Account is blocked');
    }
    
    console.log('User signed in successfully:', user.uid);
    navigate('/dashboard');
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
        setError('No account found with this email');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password');
        break;
      case 'auth/invalid-email':
        setError('Please enter a valid email address');
        break;
      default:
        setError(error.message || 'Login failed. Please try again.');
    }
  }
}
```

#### `logOut()`

Signs out the current user.

```typescript
function logOut(): Promise<void>
```

**Parameters:** None

**Returns:** Promise<void>

**Usage Example:**
```typescript
import { logOut } from '../lib/authFunctions';

async function handleLogout() {
  try {
    await logOut();
    console.log('User signed out successfully');
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Example with confirmation
function LogoutButton() {
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logOut();
    }
  };
  
  return <button onClick={handleLogout}>Sign Out</button>;
}
```

---

## Firebase Integration

### Firebase Configuration
**File:** `src/lib/firebaseConfig.ts`

Central Firebase configuration and service initialization.

#### Exported Services

```typescript
// Core Firebase services
export const db: Firestore        // Firestore database
export const storage: FirebaseStorage  // Cloud Storage
export const auth: Auth          // Authentication
export default app: FirebaseApp  // Firebase app instance
```

#### Environment Variables
```typescript
// Required environment variables with fallbacks:
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "fallback-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "app-id"
};
```

#### Usage Examples
```typescript
import { db, storage, auth } from '../lib/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firestore operations
const addProduct = async (productData) => {
  const docRef = await addDoc(collection(db, 'products'), productData);
  return docRef.id;
};

// Storage operations
const uploadImage = async (file, path) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

// Authentication state
const getCurrentUser = () => {
  return auth.currentUser;
};
```

---

## AI/Vision Services

### Google Vision API Integration
**File:** `src/lib/vision.ts`

Google Cloud Vision API integration for image analysis.

#### `analyzeImageBase64(base64: string, apiKey: string)`

Analyzes an image using Google Vision API to extract labels and information.

```typescript
function analyzeImageBase64(base64: string, apiKey: string): Promise<string[]>
```

**Parameters:**
- `base64` (string): Base64 encoded image data (with or without data URL prefix)
- `apiKey` (string): Google Cloud Vision API key

**Returns:** Promise<string[]> - Array of detected labels

**Features:**
- **Label Detection**: Identifies objects, activities, and concepts
- **Base64 Processing**: Handles data URL prefixes automatically
- **Error Handling**: Returns empty array on failure
- **Rate Limiting**: Respects API quotas and limits

#### API Request Structure
```typescript
// Internal API request format:
{
  requests: [
    {
      image: { content: base64 },
      features: [{ type: "LABEL_DETECTION", maxResults: 3 }]
    }
  ]
}
```

#### Usage Example
```typescript
import { analyzeImageBase64 } from '../lib/vision';

async function analyzeProductImage(imageFile) {
  try {
    // Convert file to base64
    const base64 = await convertFileToBase64(imageFile);
    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    
    // Analyze image
    const labels = await analyzeImageBase64(base64, apiKey);
    
    console.log('Detected labels:', labels);
    // Example output: ['Sports equipment', 'Football', 'Athletic gear']
    
    // Use labels for product categorization
    const category = suggestCategory(labels);
    const suggestedName = generateProductName(labels);
    
    return {
      category,
      suggestedName,
      aiAnalysis: labels
    };
  } catch (error) {
    console.error('Image analysis failed:', error);
    return {
      category: 'Unknown',
      suggestedName: '',
      aiAnalysis: []
    };
  }
}

// Helper function to convert file to base64
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

#### Integration with Product Form
```typescript
// Automatic image analysis in ProductForm
const handleImageUpload = async (files) => {
  const analysisPromises = files.map(async (file) => {
    const base64 = await convertFileToBase64(file);
    return analyzeImageBase64(base64, apiKey);
  });
  
  const results = await Promise.all(analysisPromises);
  const allLabels = results.flat();
  
  // Update form with AI suggestions
  setFormData(prev => ({
    ...prev,
    aiAnalysis: allLabels,
    category: suggestCategory(allLabels),
    suggestedPrice: calculatePrice(allLabels)
  }));
};
```

---

## Notification System

### Notification Utilities
**File:** `src/lib/notificationUtils.ts`

Comprehensive notification management system for user interactions.

#### Core Types
```typescript
interface Notification {
  id?: string;
  userId: string;          // Target user ID
  message: string;         // Notification content
  createdAt: any;          // Firestore timestamp
  productId: string;       // Related product ID
  type: "거래완료" | "예약중" | "판매중";  // Notification type
  readAt?: any;            // Read timestamp (null = unread)
}
```

#### `createTransactionCompletedNotification()`

Creates notifications when a transaction is completed, notifying all participants.

```typescript
function createTransactionCompletedNotification(
  productId: string,
  productName: string,
  sellerId: string,
  sellerEmail: string
): Promise<void>
```

**Parameters:**
- `productId` (string): Product that was sold
- `productName` (string): Human-readable product name
- `sellerId` (string): Seller's user ID
- `sellerEmail` (string): Seller's email for logging

**Features:**
- **Multi-recipient**: Notifies seller and all chat participants
- **Chat Integration**: Finds participants via chat room data
- **Backward Compatibility**: Supports both new and legacy chat formats
- **Error Handling**: Comprehensive logging and error recovery

#### Implementation Details
```typescript
// Process:
// 1. Create notification for seller
// 2. Find all chat participants for the product
// 3. Create notifications for each participant (excluding seller)
// 4. Handle both new (participants array) and legacy (buyerId/sellerId) formats

// Chat room structures supported:
// New format: { participants: [userId1, userId2], productId, ... }
// Legacy format: { buyerId, sellerId, productId, ... }
```

#### Usage Example
```typescript
import { createTransactionCompletedNotification } from '../lib/notificationUtils';

async function markTransactionComplete(product, sellerId, sellerEmail) {
  try {
    // Update product status
    await updateDoc(doc(db, 'products', product.id), {
      status: '거래완료',
      completedAt: serverTimestamp()
    });
    
    // Create notifications
    await createTransactionCompletedNotification(
      product.id,
      product.name,
      sellerId,
      sellerEmail
    );
    
    console.log('Transaction completed successfully');
  } catch (error) {
    console.error('Failed to complete transaction:', error);
    throw error;
  }
}

// Usage in ProductDetail component
const handlePurchase = async () => {
  if (window.confirm(`구매하시겠습니까? ${product.name}`)) {
    await markTransactionComplete(product, product.sellerId, product.sellerEmail);
    navigate('/my-purchases');
  }
};
```

#### `markNotificationAsRead(notificationId: string)`

Marks a specific notification as read.

```typescript
function markNotificationAsRead(notificationId: string): Promise<void>
```

**Usage Example:**
```typescript
import { markNotificationAsRead } from '../lib/notificationUtils';

async function handleNotificationClick(notification) {
  try {
    // Mark as read
    await markNotificationAsRead(notification.id);
    
    // Navigate to related content
    navigate(`/product/${notification.productId}`);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}
```

#### `getUnreadNotificationCount(userId: string)`

Gets the current count of unread notifications for a user.

```typescript
function getUnreadNotificationCount(userId: string): Promise<number>
```

**Usage Example:**
```typescript
import { getUnreadNotificationCount } from '../lib/notificationUtils';

async function updateNotificationBadge(userId) {
  try {
    const count = await getUnreadNotificationCount(userId);
    document.title = count > 0 ? `(${count}) S-Market` : 'S-Market';
  } catch (error) {
    console.error('Failed to get notification count:', error);
  }
}
```

#### `createChatWithParticipants()`

Creates a new chat room with modern participants array structure.

```typescript
function createChatWithParticipants(
  buyerId: string,
  sellerId: string,
  productId: string,
  productName: string
): Promise<string>
```

**Features:**
- **Modern Structure**: Uses participants array for better scalability
- **Backward Compatibility**: Maintains buyerId/sellerId fields
- **Product Context**: Links chat to specific product
- **Timestamp Tracking**: Records creation time

**Usage Example:**
```typescript
import { createChatWithParticipants } from '../lib/notificationUtils';

async function startChatWithSeller(product, buyerId) {
  try {
    const chatId = await createChatWithParticipants(
      buyerId,
      product.sellerId,
      product.id,
      product.name
    );
    
    navigate(`/chat/${chatId}`);
  } catch (error) {
    console.error('Failed to create chat:', error);
    alert('채팅방 생성에 실패했습니다.');
  }
}
```

---

## Usage Examples

### Complete Authentication Flow
```typescript
import { signUp, signIn, logOut } from '../lib/authFunctions';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebaseConfig';

function AuthenticationExample() {
  const [user, loading, error] = useAuthState(auth);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await signUp(formData.email, formData.password);
      alert('Account created successfully!');
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signIn(formData.email, formData.password);
      alert('Signed in successfully!');
    } catch (error) {
      alert(`Sign in failed: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      alert('Signed out successfully!');
    } catch (error) {
      alert(`Sign out failed: ${error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <form>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button onClick={handleSignUp}>Sign Up</button>
          <button onClick={handleSignIn}>Sign In</button>
        </form>
      )}
    </div>
  );
}
```

### Real-time Notification System
```typescript
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { markNotificationAsRead } from '../lib/notificationUtils';

function NotificationSystem() {
  const unreadCount = useUnreadNotifications();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    });

    return unsubscribe;
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.readAt) {
      await markNotificationAsRead(notification.id);
    }
    navigate(`/product/${notification.productId}`);
  };

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${!notification.readAt ? 'unread' : ''}`}
          onClick={() => handleNotificationClick(notification)}
        >
          <p>{notification.message}</p>
          <small>{notification.createdAt?.toDate().toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
}
```

### AI-Enhanced Product Upload
```typescript
import { analyzeImageBase64 } from '../lib/vision';

function AIProductUpload() {
  const [images, setImages] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState([]);
  const [suggestions, setSuggestions] = useState({});

  const handleImageUpload = async (files) => {
    setImages(files);
    
    try {
      const analysisPromises = Array.from(files).map(async (file) => {
        const base64 = await convertFileToBase64(file);
        return analyzeImageBase64(base64, import.meta.env.VITE_GOOGLE_VISION_API_KEY);
      });
      
      const results = await Promise.all(analysisPromises);
      const allLabels = results.flat();
      setAiAnalysis(allLabels);
      
      // Generate suggestions based on AI analysis
      setSuggestions({
        category: determineCategoryFromLabels(allLabels),
        name: generateProductNameFromLabels(allLabels),
        price: estimatePriceFromLabels(allLabels),
        description: generateDescriptionFromLabels(allLabels)
      });
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysis([]);
      setSuggestions({});
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files)}
      />
      
      {aiAnalysis.length > 0 && (
        <div>
          <h3>AI Analysis Results:</h3>
          <ul>
            {aiAnalysis.map((label, index) => (
              <li key={index}>{label}</li>
            ))}
          </ul>
          
          <h3>AI Suggestions:</h3>
          <p>Category: {suggestions.category}</p>
          <p>Suggested Name: {suggestions.name}</p>
          <p>Estimated Price: ₩{suggestions.price?.toLocaleString()}</p>
          <p>Description: {suggestions.description}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

### Hook Usage Guidelines

1. **Always use hooks at the top level** of React components
2. **Clean up subscriptions** in useEffect cleanup functions
3. **Handle loading and error states** appropriately
4. **Memoize expensive operations** with useMemo/useCallback when needed

### Error Handling Patterns

```typescript
// Standard error handling pattern for async operations
const handleAsyncOperation = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await someAsyncFunction();
    
    // Handle success
    setData(result);
  } catch (error) {
    console.error('Operation failed:', error);
    setError(error.message || 'Operation failed');
  } finally {
    setLoading(false);
  }
};
```

### Performance Optimization

```typescript
// Debounce expensive operations
const debouncedAnalyzeImage = useMemo(
  () => debounce(analyzeImageBase64, 500),
  []
);

// Memoize complex calculations
const processedNotifications = useMemo(() => {
  return notifications
    .filter(n => !n.readAt)
    .sort((a, b) => b.createdAt - a.createdAt);
}, [notifications]);
```

### Security Considerations

1. **Validate all inputs** before sending to APIs
2. **Use environment variables** for sensitive keys
3. **Implement proper authentication checks**
4. **Sanitize user-generated content**

```typescript
// Input validation example
const validateProductData = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) {
    errors.name = 'Product name is required';
  }
  
  if (!data.price || data.price <= 0) {
    errors.price = 'Valid price is required';
  }
  
  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  }
  
  return errors;
};
```

---

*For more implementation examples and source code, refer to the individual files in the `/src/hooks` and `/src/lib` directories.*