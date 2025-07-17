import React, { useState } from "react";
import { db, storage, auth } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";

function ProductFormWithAI() {
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [aiResults, setAiResults] = useState<{
    labels: string[];
    description: string;
    category: string;
    brand: string;
    condition: string;
    recommendedPrice: number;
    aiAnalysis: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    setAiResults(null);
    
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

  const analyzeImageWithGPT4Vision = async () => {
    if (!image) {
      setError('이미지를 선택해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // OpenAI API 키 확인
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        // API 키가 없으면 데모 모드로 실행
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
        
        const fileName = image.name.toLowerCase();
        let demoResults = {
          labels: [],
          description: '',
          category: '',
          brand: '',
          condition: '',
          recommendedPrice: 0,
          aiAnalysis: []
        };
        
        if (fileName.includes('shoe') || fileName.includes('운동화') || fileName.includes('신발')) {
          demoResults = {
            labels: ['운동화', '스포츠 용품', '신발', '피트니스', '운동'],
            description: '고품질 스포츠 운동화로, 편안한 착용감과 뛰어난 내구성을 제공합니다.',
            category: '운동화',
            brand: '나이키',
            condition: '새상품',
            recommendedPrice: 89000,
            aiAnalysis: [
              '프리미엄 스포츠 브랜드 제품',
              '고기술 쿠션 시스템 적용',
              '운동과 일상 착용 모두 적합',
              '트렌디한 디자인과 기능성 겸비'
            ]
          };
        } else if (fileName.includes('ball') || fileName.includes('공')) {
          demoResults = {
            labels: ['스포츠 공', '축구공', '스포츠 용품', '운동'],
            description: '전문가용 축구공으로, 정확한 패스와 슈팅을 위한 최적의 디자인입니다.',
            category: '스포츠 용품',
            brand: '아디다스',
            condition: '거의 새것',
            recommendedPrice: 45000,
            aiAnalysis: [
              'FIFA 공인 축구공',
              '고급 소재로 제작된 내구성',
              '정확한 볼 컨트롤 가능',
              '실내외 경기 모두 사용 가능'
            ]
          };
        } else if (fileName.includes('clothes') || fileName.includes('옷') || fileName.includes('복')) {
          demoResults = {
            labels: ['운동복', '스포츠웨어', '의류', '피트니스', '운동'],
            description: '기능성 스포츠웨어로, 땀 흡수와 통기성이 뛰어나 운동 시 최적의 편안함을 제공합니다.',
            category: '운동복',
            brand: '언더아머',
            condition: '새상품',
            recommendedPrice: 65000,
            aiAnalysis: [
              '고기능성 소재 사용',
              '뛰어난 땀 흡수 및 건조 기능',
              '자유로운 움직임을 위한 편안한 핏',
              '스타일리시한 디자인'
            ]
          };
        } else if (fileName.includes('bag') || fileName.includes('가방') || fileName.includes('백')) {
          demoResults = {
            labels: ['스포츠 가방', '운동 가방', '백팩', '스포츠 용품'],
            description: '대용량 스포츠 가방으로, 운동 용품을 안전하고 편리하게 보관할 수 있습니다.',
            category: '스포츠 가방',
            brand: '노스페이스',
            condition: '새상품',
            recommendedPrice: 120000,
            aiAnalysis: [
              '대용량 수납 공간',
              '내구성 있는 소재 사용',
              '편리한 휴대성',
              '다양한 수납 포켓'
            ]
          };
        } else {
          demoResults = {
            labels: ['스포츠 용품', '운동화', '운동복', '피트니스', '건강'],
            description: '고품질 스포츠 용품으로, 운동 성능 향상과 건강한 라이프스타일을 지원합니다.',
            category: '스포츠 용품',
            brand: '일반 브랜드',
            condition: '새상품',
            recommendedPrice: 50000,
            aiAnalysis: [
              '다목적 스포츠 용품',
              '내구성과 기능성 겸비',
              '초보자부터 전문가까지 사용 가능',
              '합리적인 가격대'
            ]
          };
        }
        
        setAiResults(demoResults);
        
        // AI 결과를 기반으로 상품 정보 자동 채우기
        if (demoResults.labels.length > 0) {
          if (!name) {
            setName(`${demoResults.brand} ${demoResults.category}`);
          }
          
          if (!desc) {
            setDesc(demoResults.description);
          }
          
          if (!price) {
            setPrice(demoResults.recommendedPrice.toString());
          }
        }
        
        return;
      }

      // 실제 OpenAI GPT-4 Vision API 호출
      const base64 = await convertToBase64(image);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `이 이미지를 분석해서 다음 정보를 JSON 형태로 제공해주세요:
                  
                  {
                    "labels": ["라벨1", "라벨2", "라벨3", "라벨4", "라벨5"],
                    "description": "상품에 대한 자연스러운 설명",
                    "category": "카테고리 (예: 운동화, 스포츠용품, 운동복 등)",
                    "brand": "브랜드명 (확인 가능한 경우)",
                    "condition": "상품 상태 (새상품, 거의새것, 중고 등)",
                    "recommendedPrice": 추천가격(숫자만),
                    "aiAnalysis": ["분석1", "분석2", "분석3", "분석4"]
                  }
                  
                  - labels: 이미지에서 확인되는 주요 특징들
                  - description: 상품에 대한 자연스러운 설명 (2-3문장)
                  - category: 스포츠 관련 카테고리로 분류
                  - brand: 브랜드 로고나 특징으로 확인 가능한 브랜드
                  - condition: 상품의 상태를 판단
                  - recommendedPrice: 한국 시장 기준 적정 가격 (원화)
                  - aiAnalysis: 상품의 특징과 장점을 4개 항목으로 분석
                  
                  JSON만 응답하고 다른 텍스트는 포함하지 마세요.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API 오류: ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI 분석 결과를 받지 못했습니다.');
      }

      // JSON 파싱
      let analysisData;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON 형식이 아닙니다.');
        }
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('AI 분석 결과를 처리할 수 없습니다.');
      }

      setAiResults(analysisData);
      
      // AI 결과를 기반으로 상품 정보 자동 채우기
      if (analysisData.labels.length > 0) {
        if (!name) {
          setName(`${analysisData.brand} ${analysisData.category}`);
        }
        
        if (!desc) {
          setDesc(analysisData.description);
        }
        
        if (!price) {
          setPrice(analysisData.recommendedPrice.toString());
        }
      }

    } catch (err: any) {
      console.error('AI 분석 오류:', err);
      setError(err.message || '이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePriceSatisfaction = (satisfaction: "satisfied" | "disappointed") => {
    // This function is no longer directly tied to AI results,
    // so it doesn't have a direct effect on price or AI results.
    // It's kept for now, but its logic might need adjustment
    // depending on how price satisfaction is handled in the new AI flow.
    console.log(`Price satisfaction: ${satisfaction}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== 상품 등록 시작 ===");
    console.log("입력된 데이터:", { name, desc, price, image: image?.name });
    
    // 사용자 인증 확인
    if (!user) {
      setError("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }
    
    // 입력 검증
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
      console.log("storage 객체:", storage);
      
      let imageUrl = "";
      
      // 이미지 업로드 (임시로 비활성화)
      if (image) {
        console.log("이미지 업로드 비활성화됨 (문제 해결 중)");
        imageUrl = "이미지 업로드 비활성화됨";
      }
      
      // Base64 변환 (간단하게)
      let imageBase64 = "";
      if (image) {
        try {
          console.log("Base64 변환 시작...");
          imageBase64 = await convertToBase64(image);
          console.log("Base64 변환 완료, 크기:", imageBase64.length);
        } catch (base64Error) {
          console.error("Base64 변환 실패:", base64Error);
        }
      }
      
      // Firestore에 상품 데이터 저장
      console.log("상품 데이터 저장 시작...");
      const productData = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        imageUrl,
        imageBase64, // Base64 백업 이미지
        aiAnalysis: aiResults?.aiAnalysis || [], // AI 분석 결과도 저장
        aiRecommendedPrice: aiResults?.recommendedPrice || null, // AI 추천 가격
        aiCategory: aiResults?.category || "", // AI 분석 카테고리
        aiBrand: aiResults?.brand || "", // AI 분석 브랜드
        aiCondition: aiResults?.condition || "", // AI 분석 상태
        priceSatisfaction: null, // 가격 만족도 (새로운 로직 적용)
        sellerId: user?.uid || null, // 판매자 ID
        sellerEmail: user?.email || null, // 판매자 이메일
        status: "판매중", // ✅ 기본값
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      console.log("저장할 데이터:", {
        name: productData.name,
        desc: productData.desc,
        price: productData.price,
        imageUrl: productData.imageUrl,
        imageBase64Length: productData.imageBase64 ? productData.imageBase64.length : 0,
        aiAnalysis: productData.aiAnalysis,
        aiRecommendedPrice: productData.aiRecommendedPrice,
        aiCategory: productData.aiCategory,
        aiBrand: productData.aiBrand,
        aiCondition: productData.aiCondition,
        priceSatisfaction: productData.priceSatisfaction,
        sellerId: productData.sellerId,
        sellerEmail: productData.sellerEmail
      });
      
      console.log("4. Firestore에 저장 시작...");
      console.log("collection 경로:", "products");
      
      const docRef = await addDoc(collection(db, "products"), productData);
      console.log("5. 상품 저장 완료!");
      console.log("문서 ID:", docRef.id);
      console.log("문서 경로:", docRef.path);
      
      setSuccess("상품이 성공적으로 등록되었습니다!");
      
      // 폼 초기화
      setName("");
      setDesc("");
      setPrice("");
      setImage(null);
      setPreview(null);
      setAiResults(null);
      
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
      } else if (error.code === 'storage/unauthorized') {
        errorMessage = "이미지 업로드 권한이 없습니다.";
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = "저장 공간이 부족합니다.";
      } else if (error.code === 'permission-denied') {
        errorMessage = "Firestore 접근 권한이 없습니다.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
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
        maxWidth: 800, 
        margin: "32px auto", 
        padding: "32px", 
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "100px" // 하단 여백 추가
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
          AI 상품 등록
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
                onClick={analyzeImageWithGPT4Vision}
                disabled={isAnalyzing}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isAnalyzing ? "#444" : "#007bff",
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

        {/* AI 분석 결과 */}
        {aiResults && (
          <div style={{ 
            marginBottom: "20px", 
            padding: "20px",
            backgroundColor: "#2a2a2a",
            borderRadius: "8px",
            border: "1px solid #28a745"
          }}>
            <h4 style={{ marginBottom: "16px", color: "#28a745", fontSize: "18px" }}>
              🤖 AI 상품 분석 결과
            </h4>
            
            {/* 상품 정보 요약 */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "16px", 
              marginBottom: "20px" 
            }}>
              {aiResults.category && (
                <div style={{ padding: "12px", backgroundColor: "#333", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>카테고리</div>
                  <div style={{ fontSize: "14px", color: "#fff" }}>{aiResults.category}</div>
                </div>
              )}
              {aiResults.brand && (
                <div style={{ padding: "12px", backgroundColor: "#333", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>브랜드</div>
                  <div style={{ fontSize: "14px", color: "#fff" }}>{aiResults.brand}</div>
                </div>
              )}
              {aiResults.condition && (
                <div style={{ padding: "12px", backgroundColor: "#333", borderRadius: "6px" }}>
                  <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>상태</div>
                  <div style={{ fontSize: "14px", color: "#fff" }}>{aiResults.condition}</div>
                </div>
              )}
            </div>

            {/* AI 추천 가격 */}
            {aiResults.recommendedPrice && (
              <div style={{ 
                marginBottom: "20px", 
                padding: "16px", 
                backgroundColor: "#1a472a", 
                borderRadius: "8px",
                border: "1px solid #28a745"
              }}>
                <div style={{ fontSize: "16px", color: "#28a745", marginBottom: "8px" }}>
                  💰 AI 추천 가격: {aiResults.recommendedPrice.toLocaleString()}원
                </div>
                
                {/* 가격 만족도 설문 */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "14px", color: "#ccc", marginBottom: "8px" }}>
                    AI 추천 가격은 어떠셨나요?
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="priceSatisfaction"
                        value="satisfied"
                        checked={false} // This state is no longer directly tied to AI results
                        onChange={() => handlePriceSatisfaction("satisfied")}
                        style={{ marginRight: "6px" }}
                      />
                      <span style={{ fontSize: "14px", color: "#28a745" }}>👍 만족해요</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="priceSatisfaction"
                        value="disappointed"
                        checked={false} // This state is no longer directly tied to AI results
                        onChange={() => handlePriceSatisfaction("disappointed")}
                        style={{ marginRight: "6px" }}
                      />
                      <span style={{ fontSize: "14px", color: "#ff6b6b" }}>👎 아쉬웠어요</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AI 분석 태그들 */}
            <div>
              <div style={{ fontSize: "14px", color: "#ccc", marginBottom: "8px" }}>분석된 특징:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {aiResults.labels.map((label, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#28a745",
                      color: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
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
            placeholder="상품명을 입력하세요 (AI 분석으로 자동 채워질 수 있습니다)"
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
            placeholder="상품 설명을 입력하세요 (AI 분석으로 자동 채워질 수 있습니다)"
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



        {/* 상품 등록 버튼 - 고정 위치 */}
        <div style={{ 
          position: "sticky",
          bottom: "20px",
          backgroundColor: "#1a1a1a",
          padding: "20px 0",
          marginTop: "30px",
          borderTop: "1px solid #333",
          zIndex: 100
        }}>
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
        </div>

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
        
        {/* 스크롤을 위한 추가 공간 */}
        <div style={{ height: "100px" }}></div>
      </form>
    </div>
  );
}

export default ProductFormWithAI; 