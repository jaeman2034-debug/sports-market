# React Components Documentation 🧩

## Table of Contents

1. [Layout Components](#layout-components)
2. [Authentication Components](#authentication-components)
3. [Product Components](#product-components)
4. [Chat Components](#chat-components)
5. [Notification Components](#notification-components)
6. [Guard Components](#guard-components)
7. [Test & Development Components](#test--development-components)
8. [Component Props Reference](#component-props-reference)

---

## Layout Components

### `AppLayout`
**File:** `src/components/AppLayout.tsx`

Main application layout wrapper that provides consistent styling and structure.

#### Props
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
}
```

#### Features
- **Dark Theme**: Applies consistent dark background (`#0a0a0a`)
- **Navigation Integration**: Includes the main navigation component
- **Notification System**: Integrates real-time notification popups
- **Chat Alerts**: Displays chat message notifications
- **Block Guard**: Automatically protects against blocked users
- **Responsive Design**: Optimized for both desktop and mobile

#### Styling
- Background: `#0a0a0a` (dark theme)
- Text color: `#ffffff` 
- Minimum height: `100vh`
- Smooth scrolling behavior
- Proper overflow handling

#### Usage Example
```typescript
import AppLayout from './components/AppLayout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<MarketPage />} />
          {/* Other routes */}
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
```

### `Navigation`
**File:** `src/components/Navigation.tsx`

Main navigation component with responsive design and user status integration.

#### Features
- **User Authentication Status**: Shows login/logout state
- **Notification Badge**: Displays unread notification count
- **Responsive Menu**: Adapts to mobile and desktop
- **Route Navigation**: Links to all major app sections
- **Admin Controls**: Special admin features when applicable

#### Usage Example
```typescript
import Navigation from './components/Navigation';

// Used automatically in AppLayout
<Navigation />
```

---

## Authentication Components

### `AuthForm`
**File:** `src/components/AuthForm.tsx`

Comprehensive authentication form supporting both login and registration.

#### Features
- **Dual Mode**: Toggle between login and registration
- **Input Validation**: Real-time form validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during authentication
- **Responsive Design**: Mobile-optimized layout

#### Form Fields
- Email address (with validation)
- Password (with strength requirements)
- Confirm password (registration only)

#### Usage Example
```typescript
import AuthForm from './components/AuthForm';

// As a route
<Route path="/login" element={<AuthForm />} />
<Route path="/register" element={<AuthForm />} />
```

### `ProtectedRoute`
**File:** `src/components/ProtectedRoute.tsx`

Route wrapper that ensures only authenticated users can access protected content.

#### Props
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

#### Behavior
- **Loading State**: Shows "로딩 중..." while checking authentication
- **Unauthenticated**: Shows "로그인한 사용자만 접근할 수 있습니다."
- **Authenticated**: Renders the wrapped component

#### Usage Example
```typescript
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/profile" element={
  <ProtectedRoute>
    <UserProfile />
  </ProtectedRoute>
} />
```

---

## Product Components

### `ProductForm`
**File:** `src/components/ProductForm.tsx`

Advanced product creation and editing form with AI integration.

#### Features
- **Image Upload**: Multiple image support with compression
- **AI Analysis**: Optional AI-powered image analysis
- **GPS Location**: Automatic location capture
- **Real-time Preview**: Live preview of product data
- **Validation**: Comprehensive form validation
- **Progress Indicators**: Upload and processing status

#### Form Fields
- Product name (required)
- Description (required)
- Price (required, numeric)
- Images (up to multiple files)
- Category (auto-detected via AI)
- Condition assessment
- Location (GPS-based)

#### AI Integration
- Automatic image analysis using OpenAI Vision
- Price recommendations based on similar products
- Category detection
- Brand identification
- Condition assessment

#### Usage Example
```typescript
import ProductForm from './components/ProductForm';

// For creating new products
<Route path="/product/upload" element={
  <ProtectedRoute>
    <ProductForm />
  </ProtectedRoute>
} />

// For editing existing products
<Route path="/product/edit/:productId" element={
  <ProtectedRoute>
    <ProductForm />
  </ProtectedRoute>
} />
```

#### Image Compression
```typescript
// Automatic compression settings:
// - Max size: 40px (extreme compression)
// - Quality: 5% JPEG
// - Max file size: 15KB
// - Fallback to FileReader for unsupported formats
```

### `ProductList`
**File:** `src/components/ProductList.tsx`

Advanced product listing with filtering, sorting, and GPS-based features.

#### Features
- **Search Functionality**: Real-time product search
- **Multiple Sort Options**: Latest, price (low/high), distance
- **GPS Integration**: Distance-based sorting and display
- **Admin Controls**: Bulk delete functionality for admins
- **Real-time Updates**: Live product status updates
- **Responsive Grid**: Adaptive layout for different screen sizes

#### Sort Options
- `latest`: Most recently added products
- `price-low`: Lowest price first
- `price-high`: Highest price first  
- `distance`: Nearest products first (requires GPS)

#### Admin Features
- **Bulk Delete**: "모든 상품 삭제" button for authorized admins
- **Admin Detection**: Automatic admin privilege checking
- **Confirmation Dialogs**: Safety checks for destructive actions

#### Usage Example
```typescript
import ProductList from './components/ProductList';

function MarketPage() {
  return (
    <div>
      <h1>Sports Marketplace</h1>
      <ProductList />
    </div>
  );
}
```

#### GPS Integration Example
```typescript
// Automatic GPS features:
// - Location permission request
// - Real-time distance calculation
// - Address resolution via Kakao Maps
// - Fallback handling for denied permissions
```

### `ProductDetail`
**File:** `src/components/ProductDetail.tsx`

Comprehensive product detail view with transaction capabilities.

#### Features
- **Full Product Display**: All product information and images
- **Image Gallery**: Swipeable image viewer
- **Transaction Actions**: Purchase, reserve, contact seller
- **Chat Integration**: Direct messaging with seller
- **Status Management**: Real-time status updates
- **Location Display**: Distance and address information
- **AI Insights**: Display AI analysis results

#### Transaction Actions
- **구매하기**: Mark product as sold
- **예약하기**: Reserve product for user
- **판매자와 채팅**: Start chat conversation
- **상품 수정**: Edit product (owner only)

#### Usage Example
```typescript
import ProductDetail from './components/ProductDetail';

<Route path="/product/:productId" element={<ProductDetail />} />
```

### `ProductEdit`
**File:** `src/components/ProductEdit.tsx`

Product editing interface with pre-populated form data.

#### Features
- **Pre-loaded Data**: Fetches and displays existing product data
- **Same Form Logic**: Reuses ProductForm component logic
- **Update Operations**: Modifies existing Firestore documents
- **Image Management**: Add/remove/replace existing images

#### Usage Example
```typescript
import ProductEdit from './components/ProductEdit';

<Route path="/product/edit/:productId" element={
  <ProtectedRoute>
    <ProductEdit />
  </ProtectedRoute>
} />
```

---

## Chat Components

### `ChatList`
**File:** `src/components/ChatList.tsx`

Displays all chat conversations for the authenticated user.

#### Features
- **Real-time Updates**: Live chat list with newest messages
- **Unread Indicators**: Visual badges for unread messages
- **Product Context**: Shows related product information
- **Last Message Preview**: Latest message snippet
- **Navigation**: Click to enter individual chat rooms
- **User Avatars**: Profile pictures and usernames

#### Chat Item Information
- Participant names and avatars
- Related product name and image
- Last message preview
- Timestamp of last activity
- Unread message count

#### Usage Example
```typescript
import ChatList from './components/ChatList';

<Route path="/chats" element={
  <ProtectedRoute>
    <ChatList />
  </ProtectedRoute>
} />
```

### `ChatRoom`
**File:** `src/components/ChatRoom.tsx`

Individual chat conversation interface with real-time messaging.

#### Features
- **Real-time Messaging**: Instant message delivery and receipt
- **Message History**: Full conversation history
- **Image Sharing**: Send and receive images
- **Product Context**: Display related product information
- **Transaction Completion**: Mark transactions as complete
- **Typing Indicators**: Show when other user is typing
- **Message Status**: Read/unread indicators

#### Message Types
- Text messages
- Image messages
- System messages (transaction updates)
- Timestamp displays

#### Transaction Features
- **거래 완료**: Mark transaction as completed
- **Notification Creation**: Automatic notifications to participants
- **Status Updates**: Real-time product status changes

#### Usage Example
```typescript
import ChatRoom from './components/ChatRoom';

<Route path="/chat/:chatId" element={
  <ProtectedRoute>
    <ChatRoom />
  </ProtectedRoute>
} />
```

---

## Notification Components

### `NotificationList`
**File:** `src/components/NotificationList.tsx`

Comprehensive notification management interface.

#### Features
- **Real-time Updates**: Live notification feed
- **Read/Unread Status**: Visual distinction and management
- **Mark as Read**: Individual and bulk read actions
- **Product Navigation**: Click notifications to view related products
- **Filtering**: Filter by read status or notification type
- **Pagination**: Handle large notification lists

#### Notification Types
- **거래완료**: Transaction completion notifications
- **예약중**: Product reservation alerts
- **판매중**: Product status change notifications
- **채팅**: New chat message notifications

#### Usage Example
```typescript
import NotificationList from './components/NotificationList';

<Route path="/notifications" element={
  <ProtectedRoute>
    <NotificationList />
  </ProtectedRoute>
} />
```

### `NotificationSnackbar`
**File:** `src/components/NotificationSnackbar.tsx`

Real-time popup notifications for immediate user feedback.

#### Features
- **Auto-dismiss**: Configurable timeout
- **Multiple Notifications**: Queue system for multiple alerts
- **Click Actions**: Navigate to related content
- **Non-intrusive Design**: Positioned to avoid content overlap
- **Animation**: Smooth enter/exit transitions

#### Notification Display
- Message text
- Timestamp
- Action buttons (optional)
- Product context (when applicable)

#### Usage Example
```typescript
import NotificationSnackbar from './components/NotificationSnackbar';

// Used automatically in AppLayout
function App() {
  return (
    <AppLayout>
      {/* NotificationSnackbar is included automatically */}
      <Routes>{/* routes */}</Routes>
    </AppLayout>
  );
}
```

### `ChatMessageSnackbar`
**File:** `src/components/ChatMessageSnackbar.tsx`

Specialized popup notifications for new chat messages.

#### Features
- **Real-time Chat Alerts**: Instant new message notifications
- **Chat Navigation**: Click to open specific chat room
- **Message Preview**: Show sender and message snippet
- **Sound Notifications**: Optional audio alerts
- **Do Not Disturb**: Respect user notification preferences

#### Message Information
- Sender name
- Message preview (truncated)
- Related product information
- Timestamp

#### Usage Example
```typescript
import ChatMessageSnackbar from './components/ChatMessageSnackbar';

// Used automatically in AppLayout
<ChatMessageSnackbar />
```

---

## Guard Components

### `AdminGuard`
**File:** `src/components/AdminGuard.tsx`

Protects routes and components that require administrator privileges.

#### Props
```typescript
interface AdminGuardProps {
  children: React.ReactNode;
}
```

#### Behavior
- **Authentication Check**: Verifies user is logged in
- **Admin Verification**: Checks Firestore user document for `isAdmin: true`
- **Automatic Redirect**: Redirects non-admins to home page
- **Loading State**: Shows verification message during check

#### Admin Detection
```typescript
// Admin status is stored in Firestore user document:
// /users/{userId} -> { isAdmin: true }
```

#### Usage Example
```typescript
import AdminGuard from './components/AdminGuard';

<Route path="/admin" element={
  <AdminGuard>
    <AdminPanel />
  </AdminGuard>
} />

// Or wrap specific components
function AdminOnlyButton() {
  return (
    <AdminGuard>
      <button onClick={deleteAllProducts}>
        🗑️ 모든 상품 삭제
      </button>
    </AdminGuard>
  );
}
```

### `BlockGuard`
**File:** `src/components/BlockGuard.tsx`

Automatically monitors and handles blocked user status.

#### Props
None - operates automatically

#### Behavior
- **Real-time Monitoring**: Watches user block status
- **Automatic Signout**: Signs out blocked users immediately
- **Redirect**: Routes blocked users to blocked page
- **Silent Operation**: No visual component, works in background

#### Block Detection
```typescript
// Block status is stored in Firestore user document:
// /users/{userId} -> { blocked: true }
```

#### Usage Example
```typescript
import BlockGuard from './components/BlockGuard';

function App() {
  return (
    <div>
      <BlockGuard /> {/* Always include at app level */}
      <Routes>
        {/* Your routes */}
      </Routes>
    </div>
  );
}
```

---

## Test & Development Components

### `AIImageAnalyzer`
**File:** `src/components/AIImageAnalyzer.tsx`

Standalone AI image analysis testing component.

#### Features
- **Image Upload**: Test image analysis functionality
- **AI Results Display**: Show analysis results
- **Multiple Models**: Test different AI services
- **Debug Information**: Detailed logging and error handling

#### Usage Example
```typescript
import AIImageAnalyzer from './components/AIImageAnalyzer';

<Route path="/ai-test" element={<AIImageAnalyzer />} />
```

### `FirebaseTest`
**File:** `src/components/FirebaseTest.tsx`

Firebase connection and functionality testing component.

#### Features
- **Connection Test**: Verify Firebase configuration
- **CRUD Operations**: Test database operations
- **Authentication Test**: Verify auth functionality
- **Storage Test**: Test file upload capabilities

### `StorageViewer`
**File:** `src/components/StorageViewer.tsx`

Firebase Storage file management and viewing component.

#### Features
- **File Listing**: Browse uploaded files
- **File Preview**: View images and documents
- **File Management**: Delete and organize files
- **Usage Statistics**: Storage usage information

---

## Component Props Reference

### Common Prop Patterns

#### Children Props
```typescript
interface ComponentProps {
  children: React.ReactNode;
}
```

#### Product Props
```typescript
interface ProductComponentProps {
  productId?: string;
  product?: Product;
  onUpdate?: (product: Product) => void;
}
```

#### User Props
```typescript
interface UserComponentProps {
  userId?: string;
  user?: User;
  showActions?: boolean;
}
```

#### Navigation Props
```typescript
interface NavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}
```

---

## Component Communication Patterns

### State Management
- **Local State**: `useState` for component-specific state
- **Global State**: Firebase real-time listeners for shared state
- **Props Drilling**: Limited to 2-3 levels maximum

### Event Handling
- **onClick**: User interaction events
- **onChange**: Form input changes
- **onSubmit**: Form submission
- **onLoad**: Component lifecycle events

### Data Flow
- **Top-down**: Props flow from parent to child
- **Bottom-up**: Callbacks for child-to-parent communication
- **Side-effects**: useEffect for external data fetching

---

## Styling Conventions

### CSS Classes
- **Component-specific**: `.component-name__element`
- **Utility classes**: `.text-center`, `.mb-4`, etc.
- **State classes**: `.active`, `.disabled`, `.loading`

### Inline Styles
- **Dynamic values**: Colors, dimensions based on props
- **Theme colors**: Consistent dark theme application
- **Responsive breakpoints**: Mobile-first approach

### Style Organization
- **Global styles**: `src/App.css` and `src/index.css`
- **Component styles**: Inline styles or CSS modules
- **Theme variables**: CSS custom properties for consistency

---

*For implementation details and source code, refer to the individual component files in the `/src/components` directory.*