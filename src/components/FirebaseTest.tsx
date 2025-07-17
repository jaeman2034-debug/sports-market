import React, { useState } from "react";
import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

function FirebaseTest() {
  const [testData, setTestData] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testWrite = async () => {
    setLoading(true);
    setResult("");
    
    try {
      console.log("Firebase 쓰기 테스트 시작...");
      
      const docRef = await addDoc(collection(db, "test"), {
        message: testData || "테스트 메시지",
        timestamp: new Date().toISOString()
      });
      
      console.log("문서가 성공적으로 추가됨, ID:", docRef.id);
      setResult(`✅ 성공! 문서 ID: ${docRef.id}`);
      
    } catch (error: any) {
      console.error("Firebase 쓰기 오류:", error);
      setResult(`❌ 오류: ${error.message} (코드: ${error.code})`);
    } finally {
      setLoading(false);
    }
  };

  const testRead = async () => {
    setLoading(true);
    setResult("");
    
    try {
      console.log("Firebase 읽기 테스트 시작...");
      
      const querySnapshot = await getDocs(collection(db, "test"));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("읽기 성공:", docs);
      setResult(`✅ 읽기 성공! 문서 수: ${docs.length}`);
      
    } catch (error: any) {
      console.error("Firebase 읽기 오류:", error);
      setResult(`❌ 읽기 오류: ${error.message} (코드: ${error.code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: "32px auto",
      padding: "32px",
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      color: "#ffffff"
    }}>
      <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
        Firebase 연결 테스트
      </h3>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
          테스트 메시지
        </label>
        <input
          value={testData}
          onChange={e => setTestData(e.target.value)}
          placeholder="테스트할 메시지를 입력하세요"
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
        />
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={testWrite}
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: loading ? "#444" : "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "테스트 중..." : "쓰기 테스트"}
        </button>
        
        <button
          onClick={testRead}
          disabled={loading}
          style={{
            flex: 1,
            padding: "12px 24px",
            backgroundColor: loading ? "#444" : "#28a745",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "테스트 중..." : "읽기 테스트"}
        </button>
      </div>

      {result && (
        <div style={{
          padding: "16px",
          backgroundColor: result.includes("✅") ? "#28a745" : "#dc3545",
          color: "#ffffff",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "14px"
        }}>
          {result}
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
        <strong>테스트 방법:</strong>
        <br />
        1. "쓰기 테스트" 버튼을 클릭하여 Firebase에 데이터 저장
        <br />
        2. "읽기 테스트" 버튼을 클릭하여 저장된 데이터 확인
        <br />
        3. 오류가 발생하면 Firebase 콘솔에서 보안 규칙을 확인하세요
      </div>
    </div>
  );
}

export default FirebaseTest; 