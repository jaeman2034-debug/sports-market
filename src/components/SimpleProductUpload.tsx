import React, { useState } from "react";
import { db, auth } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function SimpleProductUpload() {
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== 간단한 상품 등록 시작 ===");
    console.log("입력된 데이터:", { name, desc, price });
    
    // 사용자 인증 확인
    if (!user) {
      setError("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }
    
    if (!name.trim()) {
      setError("상품명을 입력해주세요.");
      return;
    }
    if (!desc.trim()) {
      setError("상품 설명을 입력해주세요.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("올바른 가격을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      console.log("1. Firebase 연결 확인 중...");
      console.log("db 객체:", db);
      
      console.log("2. 상품 데이터 준비 중...");
      const productData = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        simpleUpload: true, // 간단한 업로드 표시
        sellerId: user?.uid || null, // 판매자 ID 추가
        sellerName: user?.displayName || "Unknown Seller", // 판매자 이름 추가
        sellerEmail: user?.email || "Unknown Email" // 판매자 이메일 추가
      };
      
      console.log("저장할 데이터:", productData);
      console.log("3. Firestore에 저장 시작...");
      
      const docRef = await addDoc(collection(db, "products"), productData);
      console.log("4. 상품 저장 완료!");
      console.log("문서 ID:", docRef.id);
      console.log("문서 경로:", docRef.path);
      
      setSuccess("상품이 성공적으로 등록되었습니다!");
      
      // 폼 초기화
      setName("");
      setDesc("");
      setPrice("");
      
    } catch (error: any) {
      console.error("=== 상품 등록 오류 ===");
      console.error("오류 객체:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      
      let errorMessage = "상품 등록 중 오류가 발생했습니다.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Firestore 접근 권한이 없습니다. Firebase 콘솔에서 Firestore 규칙을 확인해주세요.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Firebase 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.";
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      console.log("5. 로딩 상태 해제");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#0a0a0a',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        maxWidth: 600, 
        margin: "32px auto", 
        padding: "32px", 
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "100px"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
          간단한 상품 등록 (이미지 없음)
        </h3>
        
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
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            width: "100%", 
            padding: "16px",
            backgroundColor: loading ? "#444" : "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 123, 255, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.3)";
            }
          }}
        >
          {loading ? "등록중..." : "상품 등록"}
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
          <strong>간단한 상품 등록:</strong> 이미지 없이 텍스트만 저장합니다.
          <br />
          Firebase Storage 문제를 우회하여 안정적으로 작동합니다.
        </div>
        {/* 스크롤을 위한 추가 공간 */}
        <div style={{ height: "100px" }}></div>
      </form>
    </div>
  );
}

export default SimpleProductUpload; 