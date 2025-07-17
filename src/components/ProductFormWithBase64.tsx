import React, { useState } from "react";
import { db, auth } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

function ProductFormWithBase64() {
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setAiResults([]);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageWithAI = async () => {
    if (!image) {
      setError('이미지를 선택해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 데모 모드: 실제 API 호출 대신 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileName = image.name.toLowerCase();
      let results = [];
      
      if (fileName.includes('shoe') || fileName.includes('운동화') || fileName.includes('신발')) {
        results = ['운동화', '스포츠 용품', '신발', '피트니스', '운동'];
      } else if (fileName.includes('ball') || fileName.includes('공')) {
        results = ['스포츠 공', '축구공', '스포츠 용품', '운동'];
      } else if (fileName.includes('clothes') || fileName.includes('옷') || fileName.includes('복')) {
        results = ['운동복', '스포츠웨어', '의류', '피트니스', '운동'];
      } else {
        results = ['스포츠 용품', '운동화', '운동복', '피트니스', '건강'];
      }
      
      setAiResults(results);
      
      if (results.length > 0) {
        const firstLabel = results[0];
        if (firstLabel && !name) {
          setName(firstLabel);
        }
        
        const description = results.join(', ');
        if (!desc) {
          setDesc(`AI 분석 결과: ${description}`);
        }
      }

    } catch (err: any) {
      console.error('AI 분석 오류:', err);
      setError(err.message || '이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== 상품 등록 시작 ===");
    console.log("입력된 데이터:", { name, desc, price, image: image?.name });
    
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
      
      let imageBase64 = "";
      
      // 이미지를 Base64로 변환
      if (image) {
        console.log("2. 이미지를 Base64로 변환 중...");
        console.log("이미지 파일:", image.name, "크기:", image.size);
        imageBase64 = await convertToBase64(image);
        console.log("Base64 변환 완료, 크기:", imageBase64.length);
      } else {
        console.log("2. 이미지 없음, Base64 변환 건너뜀");
      }
      
      // 사용자 인증 확인
      if (!user) {
        setError("로그인이 필요합니다. 먼저 로그인해주세요.");
        return;
      }
      
      // Firestore에 상품 데이터 저장 (이미지 포함)
      console.log("3. 상품 데이터 준비 중...");
      const productData = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        imageBase64: imageBase64, // Base64 이미지 데이터
        aiAnalysis: aiResults,
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      console.log("저장할 데이터:", {
        name: productData.name,
        desc: productData.desc,
        price: productData.price,
        imageBase64: productData.imageBase64 ? "이미지 포함됨" : "이미지 없음",
        imageBase64Length: productData.imageBase64.length,
        aiAnalysis: productData.aiAnalysis
      });
      
      console.log("4. Firestore에 저장 시작...");
      console.log("collection 경로:", "products");
      
      const docRef = await addDoc(collection(db, "products"), productData);
      console.log("5. 상품 저장 완료!");
      console.log("문서 ID:", docRef.id);
      console.log("문서 경로:", docRef.path);
      
      setSuccess("상품이 성공적으로 등록되었습니다! (이미지 포함)");
      
      // 폼 초기화
      setName("");
      setDesc("");
      setPrice("");
      setImage(null);
      setPreview(null);
      setAiResults([]);
      
    } catch (error: any) {
      console.error("=== 상품 등록 오류 ===");
      console.error("오류 객체:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      console.error("오류 스택:", error.stack);
      
      let errorMessage = "상품 등록 중 오류가 발생했습니다.";
      
      if (error.code === 'permission-denied') {
        errorMessage = "Firestore 접근 권한이 없습니다. Firebase 콘솔에서 Firestore 규칙을 확인해주세요.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Firebase 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.";
      } else if (error.code === 'invalid-argument') {
        errorMessage = "잘못된 데이터 형식입니다. 입력값을 확인해주세요.";
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      console.log("6. 로딩 상태 해제");
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
        maxWidth: 800, 
        margin: "32px auto", 
        padding: "32px", 
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
          Base64 이미지 상품 등록
        </h3>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            상품 이미지
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
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

        {preview && (
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <img 
              src={preview} 
              alt="미리보기" 
              style={{ 
                maxWidth: "200px", 
                maxHeight: "200px", 
                objectFit: "cover",
                borderRadius: "8px",
                border: "2px solid #333333"
              }} 
            />
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={analyzeImageWithAI}
                disabled={isAnalyzing}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isAnalyzing ? "#444" : "#28a745",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  marginRight: "8px"
                }}
              >
                {isAnalyzing ? "AI 분석 중..." : "AI 분석"}
              </button>
            </div>
          </div>
        )}

        {aiResults.length > 0 && (
          <div style={{ 
            marginBottom: "20px", 
            padding: "16px",
            backgroundColor: "#2a2a2a",
            borderRadius: "8px"
          }}>
            <h4 style={{ marginBottom: "12px", color: "#28a745" }}>AI 분석 결과</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {aiResults.map((result, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: "#28a745",
                    color: "#ffffff",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                >
                  {result}
                </span>
              ))}
            </div>
          </div>
        )}

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
          {loading ? "등록중..." : "상품 등록 (이미지 포함)"}
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
          <strong>Base64 이미지 저장:</strong> 이미지를 Base64로 인코딩하여 Firestore에 직접 저장합니다.
          <br />
          CORS 문제 없이 이미지가 포함된 상품을 등록할 수 있습니다.
        </div>
      </form>
    </div>
  );
}

export default ProductFormWithBase64; 