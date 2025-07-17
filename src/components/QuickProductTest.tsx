import React, { useState } from "react";
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

function QuickProductTest() {
  const [name, setName] = useState("테스트 상품");
  const [desc, setDesc] = useState("테스트 설명");
  const [price, setPrice] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const testProductUpload = async () => {
    setLoading(true);
    setError("");
    setResult("");
    
    try {
      console.log("=== 빠른 상품 등록 테스트 ===");
      console.log("Firebase 설정 확인:", {
        projectId: db.app.options.projectId,
        databaseId: db.app.options.databaseId
      });
      
      // 가장 간단한 데이터로 테스트
      const simpleData = {
        name: name,
        desc: desc,
        price: Number(price),
        createdAt: Timestamp.now(),
        test: true
      };
      
      console.log("저장할 데이터:", simpleData);
      
      const docRef = await addDoc(collection(db, "products"), simpleData);
      console.log("✅ 상품 등록 성공!");
      console.log("문서 ID:", docRef.id);
      
      setResult(`✅ 성공! 
상품명: ${name}
가격: ${price}원
문서 ID: ${docRef.id}
등록 시간: ${new Date().toLocaleString()}`);
      
    } catch (err: any) {
      console.error("❌ 상품 등록 실패:", err);
      console.error("오류 코드:", err.code);
      console.error("오류 메시지:", err.message);
      
      setError(`❌ 등록 실패!
오류 코드: ${err.code}
오류 메시지: ${err.message}
시간: ${new Date().toLocaleString()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: "32px auto", 
      padding: "24px",
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      color: "#ffffff"
    }}>
      <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
        빠른 상품 등록 테스트
      </h3>
      
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", color: "#cccccc" }}>
          상품명:
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "#ffffff"
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", color: "#cccccc" }}>
          설명:
        </label>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "#ffffff"
          }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "4px", color: "#cccccc" }}>
          가격:
        </label>
        <input
          value={price}
          onChange={e => setPrice(e.target.value)}
          type="number"
          style={{ 
            width: "100%", 
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: "4px",
            backgroundColor: "#2a2a2a",
            color: "#ffffff"
          }}
        />
      </div>

      <button
        onClick={testProductUpload}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: loading ? "#444" : "#007bff",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "등록 중..." : "빠른 상품 등록 테스트"}
      </button>

      {result && (
        <div style={{ 
          marginTop: "16px", 
          padding: "12px",
          backgroundColor: "#28a745",
          color: "#ffffff",
          borderRadius: "6px",
          whiteSpace: "pre-line",
          fontSize: "14px"
        }}>
          {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: "16px", 
          padding: "12px",
          backgroundColor: "#dc3545",
          color: "#ffffff",
          borderRadius: "6px",
          whiteSpace: "pre-line",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      <div style={{
        marginTop: "20px",
        padding: "12px",
        backgroundColor: "#333",
        borderRadius: "6px",
        fontSize: "12px",
        color: "#ccc"
      }}>
        <strong>테스트 목적:</strong> 이미지 없이 가장 간단한 상품 등록만 테스트
        <br />
        <strong>예상 원인:</strong> Firebase 권한, 네트워크, 설정 문제
      </div>
    </div>
  );
}

export default QuickProductTest; 