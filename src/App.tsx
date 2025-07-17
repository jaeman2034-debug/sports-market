import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductForm from "./components/ProductForm";
import ProductEdit from "./components/ProductEdit";
import ProductFormWithAI from "./components/ProductFormWithAI";
import ProductFormWithBase64 from "./components/ProductFormWithBase64";
import SimpleProductForm from "./components/SimpleProductForm";
import FirebaseTest from "./components/FirebaseTest";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import ChatList from "./components/ChatList";
import ChatRoom from "./components/ChatRoom";
import AIImageAnalyzer from "./components/AIImageAnalyzer";
import StorageViewer from "./components/StorageViewer";
import FirestoreTest from "./components/FirestoreTest";
import QuickProductTest from "./components/QuickProductTest";
import SimpleUploadTest from "./components/SimpleUploadTest";
import SimpleProductUpload from "./components/SimpleProductUpload";
import MarketPage from "./pages/market/MarketPage";
import MyPage from "./pages/mypage";
import MyProductList from "./pages/mypage/MyProductList";
import NotificationList from "./components/NotificationList";
import AppLayout from "./components/AppLayout";
import Home from "./pages/home/Home";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<AuthForm />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/ai" element={<AIImageAnalyzer />} />
          <Route path="/firebase-test" element={<FirebaseTest />} />
          <Route path="/" element={<Home />} />
          
          {/* 보호된 라우트들 */}
          <Route path="/product/upload" element={
            <ProtectedRoute>
              <ProductForm />
            </ProtectedRoute>
          } />
          <Route path="/product/edit/:productId" element={
            <ProtectedRoute>
              <ProductEdit />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-ai" element={
            <ProtectedRoute>
              <ProductFormWithAI />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-base64" element={
            <ProtectedRoute>
              <ProductFormWithBase64 />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-simple" element={
            <ProtectedRoute>
              <SimpleProductForm />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-quick" element={
            <ProtectedRoute>
              <QuickProductTest />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-simple-upload" element={
            <ProtectedRoute>
              <SimpleUploadTest />
            </ProtectedRoute>
          } />
          <Route path="/product/upload-simple-product" element={
            <ProtectedRoute>
              <SimpleProductUpload />
            </ProtectedRoute>
          } />
          
          {/* 상품 관련 라우트 */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          
          {/* 채팅 관련 라우트 */}
          <Route path="/chats" element={
            <ProtectedRoute>
              <ChatList />
            </ProtectedRoute>
          } />
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <ChatRoom />
            </ProtectedRoute>
          } />
          
          {/* 마켓 페이지 */}
          <Route path="/market" element={<MarketPage />} />
          
          {/* 마이페이지 */}
          <Route path="/mypage" element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          } />
          <Route path="/mypage/products" element={
            <ProtectedRoute>
              <MyProductList />
            </ProtectedRoute>
          } />
          <Route path="/mypage/notifications" element={
            <ProtectedRoute>
              <NotificationList />
            </ProtectedRoute>
          } />
          
          {/* 개발 도구 */}
          <Route path="/storage" element={<StorageViewer />} />
          <Route path="/firestore-test" element={<FirestoreTest />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
