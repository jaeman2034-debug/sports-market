import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebaseConfig";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: 40 }}>
        로딩 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ color: "red", textAlign: "center", marginTop: 40 }}>
        로그인한 사용자만 접근할 수 있습니다.
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute; 