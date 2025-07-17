import React, { useState } from "react";
import { signUp, signIn, logOut } from "../lib/authFunctions";
import { useNavigate } from "react-router-dom";

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("올바른 이메일을 입력해야 합니다.");
      return false;
    }
    setEmailError("");
    return true;
  };

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("비밀번호를 입력해주세요.");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      validatePassword(value);
    }
  };

  const handleSignUp = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const userCredential = await signUp(email, password);
      setUser(userCredential.user);
      alert("회원가입 성공!");
      navigate("/");
    } catch (e: any) {
      // Firebase 에러 메시지를 한글로 변환
      let errorMessage = e.message;
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = "이미 가입된 이메일 주소입니다. 로그인을 시도해주세요.";
      } else if (e.code === 'auth/weak-password') {
        errorMessage = "비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.";
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = "올바르지 않은 이메일 형식입니다.";
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMessage = "이메일/비밀번호 로그인이 비활성화되어 있습니다.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const userCredential = await signIn(email, password);
      setUser(userCredential.user);
      alert("로그인 성공!");
      navigate("/");
    } catch (e: any) {
      // Firebase 에러 메시지를 한글로 변환
      let errorMessage = e.message;
      if (e.code === 'auth/invalid-credential') {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다. 회원가입을 먼저 해주세요.";
      } else if (e.code === 'auth/user-not-found') {
        errorMessage = "등록되지 않은 이메일 주소입니다. 회원가입을 먼저 해주세요.";
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = "올바르지 않은 이메일 형식입니다.";
      } else if (e.code === 'auth/user-disabled') {
        errorMessage = "비활성화된 계정입니다.";
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = async () => {
    setLoading(true);
    setError("");
    try {
      await logOut();
      setUser(null);
      alert("로그아웃!");
      navigate("/auth");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: "40px auto", 
      padding: 32, 
      backgroundColor: "#1a1a1a",
      borderRadius: 12,
      color: "#ffffff"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: 32, color: "#ffffff" }}>
        회원가입 / 로그인
      </h2>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: "block", 
          marginBottom: 8, 
          color: "#cccccc",
          fontSize: "14px"
        }}>
          이메일
        </label>
        <input
          value={email}
          onChange={handleEmailChange}
          onBlur={() => validateEmail(email)}
          placeholder="이메일을 입력하세요"
          style={{ 
            width: "100%", 
            padding: "12px 16px",
            border: emailError ? "2px solid #ff4444" : "2px solid #333333",
            borderRadius: 8,
            backgroundColor: "#2a2a2a",
            color: "#ffffff",
            fontSize: "16px",
            outline: "none",
            transition: "border-color 0.2s"
          }}
        />
        {emailError && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginTop: 8, 
            color: "#ff4444",
            fontSize: "14px"
          }}>
            <span style={{ 
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#ff4444",
              color: "#ffffff",
              textAlign: "center",
              lineHeight: "16px",
              fontSize: "12px",
              marginRight: 8
            }}>
              !
            </span>
            {emailError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: "block", 
          marginBottom: 8, 
          color: "#cccccc",
          fontSize: "14px"
        }}>
          비밀번호
        </label>
        <input
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => validatePassword(password)}
          type="password"
          placeholder="비밀번호를 입력하세요"
          style={{ 
            width: "100%", 
            padding: "12px 16px",
            border: passwordError ? "2px solid #ff4444" : "2px solid #333333",
            borderRadius: 8,
            backgroundColor: "#2a2a2a",
            color: "#ffffff",
            fontSize: "16px",
            outline: "none",
            transition: "border-color 0.2s"
          }}
        />
        {passwordError && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginTop: 8, 
            color: "#ff4444",
            fontSize: "14px"
          }}>
            <span style={{ 
              display: "inline-block",
              width: 16,
              height: 16,
              borderRadius: "50%",
              backgroundColor: "#ff4444",
              color: "#ffffff",
              textAlign: "center",
              lineHeight: "16px",
              fontSize: "12px",
              marginRight: 8
            }}>
              !
            </span>
            {passwordError}
          </div>
        )}
      </div>

      <button 
        onClick={handleSignUp} 
        disabled={loading} 
        style={{ 
          width: "100%", 
          marginBottom: 12,
          padding: "14px",
          backgroundColor: "#007bff",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: "16px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "background-color 0.2s"
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = "#0056b3")}
        onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = "#007bff")}
      >
        {loading ? "처리중..." : "회원가입"}
      </button>
      
      <button 
        onClick={handleSignIn} 
        disabled={loading} 
        style={{ 
          width: "100%", 
          marginBottom: 12,
          padding: "14px",
          backgroundColor: "#28a745",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: "16px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "background-color 0.2s"
        }}
        onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = "#1e7e34")}
        onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = "#28a745")}
      >
        {loading ? "처리중..." : "로그인"}
      </button>
      
      {user && (
        <button 
          onClick={handleLogOut} 
          disabled={loading} 
          style={{ 
            width: "100%", 
            marginBottom: 12,
            padding: "14px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = "#c82333")}
          onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = "#dc3545")}
        >
          {loading ? "처리중..." : "로그아웃"}
        </button>
      )}
      
      {user && (
        <div style={{ 
          marginTop: 16, 
          padding: "12px 16px",
          backgroundColor: "#28a745",
          color: "#ffffff",
          borderRadius: 8,
          textAlign: "center",
          fontSize: "14px"
        }}>
          환영합니다, {user.email}님!
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: 16, 
          padding: "12px 16px",
          backgroundColor: "#dc3545",
          color: "#ffffff",
          borderRadius: 8,
          textAlign: "center",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default AuthForm; 