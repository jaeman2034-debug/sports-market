import React, { useState } from "react";
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

function FirestoreTest() {
  const [testMessage, setTestMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const testFirestoreConnection = async () => {
    setLoading(true);
    setError("");
    setResult("");
    
    try {
      console.log("=== Firestore 연결 테스트 시작 ===");
      console.log("db 객체:", db);
      
      // 1. 간단한 테스트 데이터 저장
      console.log("1. 테스트 데이터 저장 중...");
      const testData = {
        message: testMessage || "테스트 메시지",
        timestamp: Timestamp.now(),
        test: true
      };
      
      console.log("저장할 데이터:", testData);
      const docRef = await addDoc(collection(db, "test"), testData);
      console.log("저장 완료! 문서 ID:", docRef.id);
      
      // 2. 저장된 데이터 읽기
      console.log("2. 저장된 데이터 읽기 중...");
      const querySnapshot = await getDocs(collection(db, "test"));
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("읽어온 데이터:", documents);
      
      setResult(`✅ 성공! 
저장된 문서 ID: ${docRef.id}
총 테스트 문서 수: ${documents.length}
마지막 문서: ${JSON.stringify(documents[documents.length - 1], null, 2)}`);
      
    } catch (err: any) {
      console.error("=== Firestore 테스트 오류 ===");
      console.error("오류 객체:", err);
      console.error("오류 코드:", err.code);
      console.error("오류 메시지:", err.message);
      
      setError(`❌ 오류 발생!
코드: ${err.code}
메시지: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "32px auto", 
      padding: "32px",
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      color: "#ffffff"
    }}>
      <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
        Firestore 연결 테스트
      </h3>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", color: "#cccccc" }}>
          테스트 메시지 (선택사항):
        </label>
        <input
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          placeholder="테스트할 메시지를 입력하세요"
          style={{ 
            width: "100%", 
            padding: "12px 16px",
            border: "2px solid #333333",
            borderRadius: "8px",
            backgroundColor: "#2a2a2a",
            color: "#ffffff",
            fontSize: "16px"
          }}
        />
      </div>

      <button
        onClick={testFirestoreConnection}
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
          marginBottom: "20px"
        }}
      >
        {loading ? "테스트 중..." : "Firestore 연결 테스트"}
      </button>

      {result && (
        <div style={{ 
          marginTop: "16px", 
          padding: "16px",
          backgroundColor: "#28a745",
          color: "#ffffff",
          borderRadius: "8px",
          whiteSpace: "pre-line",
          fontSize: "14px"
        }}>
          {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: "16px", 
          padding: "16px",
          backgroundColor: "#dc3545",
          color: "#ffffff",
          borderRadius: "8px",
          whiteSpace: "pre-line",
          fontSize: "14px"
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
        <strong>테스트 내용:</strong>
        <br />
        • Firestore 연결 확인
        <br />
        • 데이터 쓰기 테스트
        <br />
        • 데이터 읽기 테스트
        <br />
        • 오류 상세 정보 표시
      </div>
    </div>
  );
}

export default FirestoreTest; 