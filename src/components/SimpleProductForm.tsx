import React, { useState } from "react";
import { db, auth } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function SimpleProductForm() {
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitAttempts, setSubmitAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 SimpleProductForm - 폼 제출 시작");
    console.log("현재 상태:", { name, desc, price, loading, submitAttempts });
    
    // 무한 루프 방지
    if (loading) {
      console.log("⚠️ 이미 로딩 중입니다. 중복 제출 방지");
      return;
    }
    
    if (submitAttempts >= 3) {
      console.log("⚠️ 최대 제출 시도 횟수 초과");
      setError("너무 많은 시도가 있었습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      return;
    }
    
    // 입력 검증
    if (!name.trim()) {
      console.log("❌ 상품명 검증 실패");
      setError("상품명을 입력해주세요.");
      return;
    }
    if (!desc.trim()) {
      console.log("❌ 상품 설명 검증 실패");
      setError("상품 설명을 입력해주세요.");
      return;
    }
    if (!price || Number(price) <= 0) {
      console.log("❌ 가격 검증 실패");
      setError("올바른 가격을 입력해주세요.");
      return;
    }

    // 사용자 인증 확인
    if (!user) {
      console.log("❌ 사용자 인증 실패");
      setError("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }
    
    console.log("✅ 입력 검증 통과");
    console.log("사용자 정보:", { uid: user.uid, email: user.email });
    
    setLoading(true);
    setError("");
    setSuccess("");
    setSubmitAttempts(prev => prev + 1);
    
    try {
      console.log("💾 Firestore 저장 시작...");
      console.log("Firebase 연결 확인 중...");
      console.log("DB 객체:", db);
      
      const productData = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: "판매중" // 기본 상태 추가
      };
      
      console.log("저장할 데이터:", productData);
      console.log("Collection 참조 생성 중...");
      
      const productsCollection = collection(db, "products");
      console.log("Collection 참조:", productsCollection);
      
      console.log("addDoc 호출 중...");
      const docRef = await addDoc(productsCollection, productData);
      console.log("✅ 상품 저장 완료, 문서 ID:", docRef.id);
      
      setSuccess("상품이 성공적으로 등록되었습니다!");
      
      // 폼 초기화
      setName("");
      setDesc("");
      setPrice("");
      setSubmitAttempts(0); // 성공 시 카운터 리셋
      
    } catch (error: any) {
      console.error("❌ 상품 등록 오류:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      console.error("전체 오류 객체:", error);
      
      let errorMessage = "상품 등록 중 오류가 발생했습니다.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Firestore 접근 권한이 없습니다. Firebase 콘솔에서 보안 규칙을 확인해주세요.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Firebase 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.";
      } else if (error.code === 'not-found') {
        errorMessage = "Firestore 데이터베이스를 찾을 수 없습니다.";
      } else if (error.message) {
        errorMessage = `${error.message} (코드: ${error.code})`;
      }
      
      setError(errorMessage);
    } finally {
      console.log("🏁 폼 제출 완료 - 로딩 상태 해제");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#0a0a0a'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        maxWidth: 600, 
        margin: "32px auto", 
        padding: "32px", 
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
          간단한 상품 등록 (이미지 없음) - 테스트용
        </h3>
        
        {/* 디버깅 정보 */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "12px", 
          backgroundColor: "#333", 
          borderRadius: "8px",
          fontSize: "12px",
          color: "#ccc"
        }}>
          <strong>디버깅 정보:</strong><br />
          로딩 상태: {loading ? "진행중" : "대기중"}<br />
          제출 시도: {submitAttempts}/3<br />
          사용자: {user ? `${user.email} (${user.uid})` : "로그인 필요"}<br />
          Firebase 연결: {db ? "✅ 연결됨" : "❌ 연결 안됨"}
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            상품명
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="상품명을 입력하세요"
            style={{ 
              width: "100%", 
              padding: "12px 16px",
              border: "2px solid #333333",
              borderRadius: "8px",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none"
            }}
            required
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            설명
          </label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="상품 설명을 입력하세요"
            style={{ 
              width: "100%", 
              padding: "12px 16px",
              border: "2px solid #333333",
              borderRadius: "8px",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none",
              minHeight: "100px",
              resize: "vertical"
            }}
            required
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            가격
          </label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="가격을 입력하세요"
            type="number"
            style={{ 
              width: "100%", 
              padding: "12px 16px",
              border: "2px solid #333333",
              borderRadius: "8px",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              fontSize: "16px",
              outline: "none"
            }}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: "100%", 
            padding: "14px",
            backgroundColor: loading ? "#444" : "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "등록중..." : "상품 등록 (테스트)"}
        </button>

        {success && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px 16px",
            backgroundColor: "#28a745",
            color: "#ffffff",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            {success}
          </div>
        )}
        
        {error && (
          <div style={{ 
            marginTop: "16px", 
            padding: "12px 16px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <div style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "#333",
          borderRadius: "8px",
          fontSize: "14px",
          color: "#ccc"
        }}>
          <strong>참고:</strong> 이 폼은 이미지 없이 텍스트만 저장합니다.
          <br />
          Firebase 권한 문제를 테스트하기 위한 간단한 버전입니다.
          <br />
          브라우저 개발자 도구의 콘솔을 확인하여 자세한 로그를 확인하세요.
        </div>
      </form>
    </div>
  );
}

export default SimpleProductForm; 