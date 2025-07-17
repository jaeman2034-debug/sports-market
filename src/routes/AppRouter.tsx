// src/routes/AppRouter.tsx
import { Routes, Route } from "react-router-dom";
import Home from "../pages/home/Home";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebaseConfig";
import AuthForm from "../components/AuthForm";
import ProductList from "../components/ProductList";
import ProductDetail from "../components/ProductDetail";
import ChatList from "../components/ChatList";
import ChatRoom from "../components/ChatRoom";
import ProductForm from "../components/ProductForm";
import ProductFormWithAI from "../components/ProductFormWithAI";

// 임시 페이지 컴포넌트 (나중에 각 폴더에 실제 컴포넌트로 교체)
const Market = () => <ProductList />;
const Club = () => <div>운동 모임</div>;
const Job = () => <div>체육 일자리</div>;
const Mypage = () => <ChatList />;
const Auth = () => <AuthForm />;

function UserStatus() {
  const [user] = useAuthState(auth);
  if (!user) return null;
  return (
    <div style={{ textAlign: "right", margin: 16 }}>
      {user.email}님 <button onClick={() => auth.signOut()}>로그아웃</button>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/market" element={<Market />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/product/upload" element={<ProductForm />} />
      <Route path="/product/upload-ai" element={<ProductFormWithAI />} />
      <Route path="/product/edit/:productId" element={<ProductForm />} />
      <Route path="/chat" element={<ChatList />} />
      <Route path="/chat/:chatId" element={<ChatRoom />} />
      <Route path="/club" element={<Club />} />
      <Route path="/job" element={<Job />} />
      <Route path="/mypage" element={<Mypage />} />
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}
