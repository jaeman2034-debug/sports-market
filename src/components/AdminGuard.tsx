import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login", { replace: true }); // 로그인 필요
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data?.isAdmin === true) {
        setIsAdmin(true);
      } else {
        navigate("/", { replace: true }); // 권한 없음 → 홈으로
      }
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  if (loading) return <p className="text-center p-10">관리자 권한 확인 중...</p>;
  return isAdmin ? <>{children}</> : null;
} 