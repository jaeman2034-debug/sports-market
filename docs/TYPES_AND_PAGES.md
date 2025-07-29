# TypeScript Interfaces and Page Components 📄🧭

## Table of Contents

1. [TypeScript Interfaces](#typescript-interfaces)
2. [Type Definitions](#type-definitions)
3. [Page Components](#page-components)
4. [Routing Structure](#routing-structure)
5. [Data Models](#data-models)
6. [API Response Types](#api-response-types)
7. [Component Props Types](#component-props-types)

---

## TypeScript Interfaces

### Core Data Models

#### `Product` Interface
**Location:** Used throughout product-related components

Complete product data structure for the marketplace.

```typescript
interface Product {
  id: string;                    // Firestore document ID
  name: string;                  // Product name/title
  desc: string;                  // Product description
  price: number;                 // Price in KRW
  imageUrl?: string;             // Firebase Storage URL (legacy)
  imageBase64?: string;          // Base64 encoded image data
  aiAnalysis?: string[];         // AI-detected labels
  aiRecommendedPrice?: number;   // AI-suggested price
  aiCategory?: string;           // AI-detected category
  aiBrand?: string;              // AI-detected brand
  aiCondition?: string;          // AI-assessed condition
  priceSatisfaction?: "satisfied" | "disappointed";  // User price feedback
  sellerId?: string;             // Seller's user ID
  sellerEmail?: string;          // Seller's email
  status?: "판매중" | "예약중" | "거래완료";  // Product status
  createdAt?: { seconds: number };  // Firestore timestamp
  image?: string;                // Alternative image field
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}
```

#### Usage Examples
```typescript
// Creating a new product
const newProduct: Omit<Product, 'id'> = {
  name: 'Nike Running Shoes',
  desc: 'Gently used Nike running shoes, size 10',
  price: 80000,
  imageBase64: 'data:image/jpeg;base64,/9j/4AAQ...',
  aiAnalysis: ['Footwear', 'Athletic shoes', 'Nike'],
  aiCategory: 'Sports Equipment',
  sellerId: 'user123',
  sellerEmail: 'seller@example.com',
  status: '판매중',
  location: {
    latitude: 37.5665,
    longitude: 126.9780,
    address: '서울특별시 중구'
  }
};

// Updating product status
const updateProductStatus = (productId: string, status: Product['status']) => {
  return updateDoc(doc(db, 'products', productId), { status });
};

// Type-safe product filtering
const filterProductsByStatus = (products: Product[], status: Product['status']) => {
  return products.filter(product => product.status === status);
};
```

#### `Notification` Interface
**Location:** `src/lib/notificationUtils.ts` and notification components

Notification system data structure.

```typescript
interface Notification {
  id?: string;                                    // Firestore document ID
  userId: string;                                 // Target user ID
  message: string;                                // Notification content
  createdAt: any;                                // Firestore timestamp
  productId: string;                              // Related product ID
  type: "거래완료" | "예약중" | "판매중";          // Notification type
  readAt?: any;                                  // Read timestamp (null = unread)
}
```

#### Usage Examples
```typescript
// Creating a notification
const createNotification = async (notification: Omit<Notification, 'id'>) => {
  await addDoc(collection(db, 'notifications'), notification);
};

// Type-safe notification filtering
const getUnreadNotifications = (notifications: Notification[]) => {
  return notifications.filter(n => !n.readAt);
};

// Notification type checking
const isTransactionNotification = (notification: Notification): boolean => {
  return notification.type === '거래완료';
};
```

### Chat System Types

#### `Chat` Interface
```typescript
interface Chat {
  id?: string;                    // Firestore document ID
  buyerId: string;                // Buyer's user ID
  sellerId: string;               // Seller's user ID
  productId: string;              // Related product ID
  productName: string;            // Product name for context
  participants: string[];         // Array of participant IDs
  createdAt: any;                 // Firestore timestamp
  lastMessage?: string;           // Latest message preview
  lastMessageAt?: any;            // Latest message timestamp
  unreadCount?: { [userId: string]: number };  // Unread counts per user
}
```

#### `Message` Interface
```typescript
interface Message {
  id?: string;                    // Firestore document ID
  chatId: string;                 // Parent chat ID
  senderId: string;               // Message sender ID
  senderEmail?: string;           // Sender email for display
  content: string;                // Message text content
  imageUrl?: string;              // Optional image attachment
  createdAt: any;                 // Firestore timestamp
  readBy?: { [userId: string]: any };  // Read receipts
  type?: 'text' | 'image' | 'system';  // Message type
}
```

### User System Types

#### `User` Interface
```typescript
interface User {
  id: string;                     // User ID (matches auth.uid)
  email: string;                  // Email address
  displayName?: string;           // Optional display name
  profileImageUrl?: string;       // Profile picture URL
  createdAt: any;                 // Account creation timestamp
  blocked?: boolean;              // Admin blocking status
  isAdmin?: boolean;              // Admin privileges
  lastSeen?: any;                 // Last activity timestamp
  preferences?: {
    notifications: boolean;
    emailUpdates: boolean;
    locationSharing: boolean;
  };
}
```

### Location Types

#### `Location` Interface
```typescript
interface Location {
  latitude: number;               // GPS latitude
  longitude: number;              // GPS longitude
  address?: string;               // Human-readable address
  city?: string;                  // City name
  district?: string;              // District/borough
  accuracy?: number;              // GPS accuracy in meters
}
```

#### `LocationPermissionStatus` Type
```typescript
type LocationPermissionStatus = 'granted' | 'denied' | 'pending';
```

### Form and UI Types

#### `SortOption` Type
```typescript
type SortOption = 'latest' | 'price-low' | 'price-high' | 'distance';
```

#### `LoadingState` Interface
```typescript
interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;              // 0-100 percentage
}
```

#### `ErrorState` Interface
```typescript
interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: any;
}
```

---

## Type Definitions

### Utility Types

#### `ApiResponse<T>` Generic Type
```typescript
type ApiResponse<T> = {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: number;
};

// Usage examples
type ProductResponse = ApiResponse<Product>;
type ProductListResponse = ApiResponse<Product[]>;
type NotificationResponse = ApiResponse<Notification>;
```

#### `DatabaseEntity` Generic Type
```typescript
type DatabaseEntity<T> = T & {
  id: string;
  createdAt: any;
  updatedAt?: any;
};

// Usage examples
type ProductEntity = DatabaseEntity<Product>;
type UserEntity = DatabaseEntity<User>;
```

#### `OptionalFields<T, K>` Utility Type
```typescript
type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Usage example - make certain Product fields optional
type ProductInput = OptionalFields<Product, 'id' | 'createdAt' | 'status'>;
```

### Firebase Types

#### `FirestoreTimestamp` Type
```typescript
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
};
```

#### `StorageReference` Type
```typescript
type StorageReference = {
  bucket: string;
  fullPath: string;
  name: string;
};
```

### Event Handler Types

#### `FormSubmitHandler` Type
```typescript
type FormSubmitHandler<T> = (data: T) => Promise<void> | void;

// Usage examples
type ProductFormSubmitHandler = FormSubmitHandler<Product>;
type AuthFormSubmitHandler = FormSubmitHandler<{ email: string; password: string }>;
```

#### `ClickHandler` Type
```typescript
type ClickHandler = (event: React.MouseEvent<HTMLElement>) => void;
type AsyncClickHandler = (event: React.MouseEvent<HTMLElement>) => Promise<void>;
```

---

## Page Components

### Home Page
**File:** `src/pages/home/Home.tsx`

Landing page component with app overview and quick navigation.

#### Features
- **Welcome Message**: App introduction and branding
- **Quick Actions**: Direct links to main features
- **Featured Products**: Highlighted marketplace items
- **User Status**: Login prompt or user greeting

#### Props
```typescript
interface HomeProps {
  // No props - standalone page component
}
```

#### Usage Example
```typescript
import Home from '../pages/home/Home';

<Route path="/" element={<Home />} />
```

### Market Page
**File:** `src/pages/market/MarketPage.tsx`

Main marketplace page with advanced product browsing.

#### Features
- **Product Grid**: Responsive product listing
- **Advanced Filtering**: Search, category, price range
- **Sorting Options**: Price, date, distance-based sorting
- **GPS Integration**: Location-based product discovery
- **Real-time Updates**: Live product status changes

#### Props
```typescript
interface MarketPageProps {
  initialFilter?: {
    category?: string;
    priceRange?: [number, number];
    location?: Location;
  };
}
```

#### Usage Example
```typescript
import MarketPage from '../pages/market/MarketPage';

<Route path="/market" element={<MarketPage />} />

// With initial filter
<Route path="/market/sports" element={
  <MarketPage initialFilter={{ category: 'Sports Equipment' }} />
} />
```

### My Page
**File:** `src/pages/mypage/index.tsx`

User profile and account management interface.

#### Features
- **Profile Information**: User details and settings
- **Account Management**: Email, password, preferences
- **Activity Summary**: Recent transactions and listings
- **Navigation Links**: Quick access to user-specific pages

#### Props
```typescript
interface MyPageProps {
  userId?: string;  // Optional - defaults to current user
}
```

#### Usage Example
```typescript
import MyPage from '../pages/mypage';

<Route path="/mypage" element={
  <ProtectedRoute>
    <MyPage />
  </ProtectedRoute>
} />
```

### My Product List Page
**File:** `src/pages/mypage/MyProductList.tsx`

User's own product management interface.

#### Features
- **Product Management**: Edit, delete, view user's products
- **Status Tracking**: Monitor sales progress
- **Performance Analytics**: View metrics and insights
- **Quick Actions**: Rapid product status updates

#### Props
```typescript
interface MyProductListProps {
  userId?: string;  // Optional - defaults to current user
  filter?: {
    status?: Product['status'];
    dateRange?: [Date, Date];
  };
}
```

#### Usage Example
```typescript
import MyProductList from '../pages/mypage/MyProductList';

<Route path="/mypage/products" element={
  <ProtectedRoute>
    <MyProductList />
  </ProtectedRoute>
} />

// With status filter
<Route path="/mypage/products/sold" element={
  <ProtectedRoute>
    <MyProductList filter={{ status: '거래완료' }} />
  </ProtectedRoute>
} />
```

### Blocked User Page
**File:** `src/pages/blocked.tsx`

Page displayed to blocked users with information and support options.

#### Features
- **Block Notification**: Clear message about account status
- **Support Information**: Contact details for appeals
- **Automatic Signout**: Ensures blocked users can't access content

#### Props
```typescript
interface BlockedPageProps {
  reason?: string;        // Optional block reason
  supportEmail?: string;  // Custom support contact
}
```

#### Usage Example
```typescript
import BlockedPage from '../pages/blocked';

<Route path="/blocked" element={<BlockedPage />} />
```

---

## Routing Structure

### Main App Router
**File:** `src/App.tsx`

Complete routing configuration with protection and guards.

```typescript
// Route structure overview:
const routeStructure = {
  public: [
    { path: '/', component: 'Home' },
    { path: '/login', component: 'AuthForm' },
    { path: '/auth', component: 'AuthForm' },
    { path: '/ai', component: 'AIImageAnalyzer' },
    { path: '/firebase-test', component: 'FirebaseTest' },
    { path: '/products', component: 'ProductList' },
    { path: '/product/:productId', component: 'ProductDetail' },
    { path: '/market', component: 'MarketPage' }
  ],
  protected: [
    { path: '/product/upload', component: 'ProductForm' },
    { path: '/product/edit/:productId', component: 'ProductEdit' },
    { path: '/product/upload-ai', component: 'ProductFormWithAI' },
    { path: '/chats', component: 'ChatList' },
    { path: '/chat/:chatId', component: 'ChatRoom' },
    { path: '/mypage', component: 'MyPage' },
    { path: '/mypage/products', component: 'MyProductList' },
    { path: '/mypage/notifications', component: 'NotificationList' }
  ],
  development: [
    { path: '/storage', component: 'StorageViewer' },
    { path: '/firestore-test', component: 'FirestoreTest' }
  ]
};
```

### Route Parameters

#### Product Routes
```typescript
// Product detail route
type ProductDetailParams = {
  productId: string;
};

// Product edit route
type ProductEditParams = {
  productId: string;
};

// Usage in components
const { productId } = useParams<ProductDetailParams>();
```

#### Chat Routes
```typescript
// Chat room route
type ChatRoomParams = {
  chatId: string;
};

// Usage in components
const { chatId } = useParams<ChatRoomParams>();
```

### Route Guards Implementation

#### Protected Route Wrapper
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo);
    }
  }, [loading, user, navigate, redirectTo]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <>{children}</>;
};
```

#### Admin Route Guard
```typescript
interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setIsAdmin(userDoc.data()?.isAdmin === true);
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <UnauthorizedMessage />;

  return <>{children}</>;
};
```

---

## Data Models

### Database Collections

#### Products Collection
```typescript
// Firestore path: /products/{productId}
interface ProductDocument extends Product {
  // Additional computed fields
  viewCount?: number;
  favoriteCount?: number;
  searchKeywords?: string[];  // For search optimization
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  reportCount?: number;
}
```

#### Users Collection
```typescript
// Firestore path: /users/{userId}
interface UserDocument extends User {
  // Additional profile data
  stats?: {
    productsSold: number;
    productsBought: number;
    averageRating: number;
    totalTransactions: number;
  };
  settings?: {
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
    privacy: {
      showEmail: boolean;
      showLocation: boolean;
      allowMessages: boolean;
    };
  };
}
```

#### Chats Collection
```typescript
// Firestore path: /chats/{chatId}
interface ChatDocument extends Chat {
  // Additional metadata
  metadata?: {
    messageCount: number;
    lastActivity: any;
    archived: boolean;
    priority: 'low' | 'normal' | 'high';
  };
}
```

### Subcollections

#### Messages Subcollection
```typescript
// Firestore path: /chats/{chatId}/messages/{messageId}
interface MessageDocument extends Message {
  // Additional message data
  edited?: boolean;
  editedAt?: any;
  reactions?: { [emoji: string]: string[] };  // emoji -> user IDs
  replyTo?: string;  // Reference to parent message ID
}
```

#### Notifications Subcollection
```typescript
// Firestore path: /notifications/{notificationId}
interface NotificationDocument extends Notification {
  // Additional notification data
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  category?: 'transaction' | 'chat' | 'system' | 'promotion';
}
```

---

## API Response Types

### Firebase Response Wrappers

#### Query Result Types
```typescript
type QueryResult<T> = {
  docs: Array<{
    id: string;
    data: () => T;
    exists: boolean;
  }>;
  size: number;
  empty: boolean;
};

type DocumentResult<T> = {
  id: string;
  data: () => T | undefined;
  exists: boolean;
};
```

#### Real-time Listener Types
```typescript
type SnapshotListener<T> = (snapshot: QueryResult<T>) => void;
type DocumentListener<T> = (snapshot: DocumentResult<T>) => void;
type ErrorListener = (error: Error) => void;

// Usage example
const useRealtimeProducts = (): Product[] => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot: QueryResult<Product>) => {
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productList);
      }
    );

    return unsubscribe;
  }, []);

  return products;
};
```

---

## Component Props Types

### Common Component Props

#### Layout Component Props
```typescript
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface HeaderProps extends LayoutProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}
```

#### Form Component Props
```typescript
interface FormProps<T> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  validationSchema?: any;  // Yup or Joi schema
  loading?: boolean;
  errors?: { [K in keyof T]?: string };
}

// Usage example
type ProductFormProps = FormProps<Product> & {
  mode: 'create' | 'edit';
  productId?: string;
};
```

#### List Component Props
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onRefresh?: () => Promise<void>;
  pagination?: {
    hasMore: boolean;
    loadMore: () => Promise<void>;
  };
}

// Usage example
type ProductListProps = ListProps<Product> & {
  sortBy?: SortOption;
  filterBy?: {
    category?: string;
    priceRange?: [number, number];
    location?: Location;
  };
  onProductClick: (product: Product) => void;
};
```

---

*For implementation details and source code, refer to the individual component and page files in the `/src` directory.*