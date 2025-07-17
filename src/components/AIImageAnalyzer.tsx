import React, { useState } from 'react';

interface AIImageAnalyzerProps {
  onAnalysisComplete?: (analysis: {
    labels: string[];
    description: string;
    category: string;
    brand: string;
    condition: string;
    recommendedPrice: number;
    aiAnalysis: string[];
  }) => void;
}

function AIImageAnalyzer({ onAnalysisComplete }: AIImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    labels: string[];
    description: string;
    category: string;
    brand: string;
    condition: string;
    recommendedPrice: number;
    aiAnalysis: string[];
  } | null>(null);
  const [error, setError] = useState<string>('');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      setAnalysisResults(null);
      
      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
    if (!selectedImage) {
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
        
        const fileName = selectedImage.name.toLowerCase();
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
        
        setAnalysisResults(demoResults);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(demoResults);
        }
        
        return;
      }

      // 실제 OpenAI GPT-4 Vision API 호출
      const base64 = await convertToBase64(selectedImage);
      
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
        // JSON 부분만 추출
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

      setAnalysisResults(analysisData);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisData);
      }

    } catch (err: any) {
      console.error('AI 분석 오류:', err);
      setError(err.message || '이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl('');
    setAnalysisResults(null);
    setError('');
  };

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      color: '#ffffff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#ffffff' }}>
        🤖 AI 이미지 분석기 (GPT-4 Vision)
      </h2>

      {/* API 키 상태 표시 */}
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: import.meta.env.VITE_OPENAI_API_KEY ? '#28a745' : '#ffc107',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        {import.meta.env.VITE_OPENAI_API_KEY 
          ? '✅ OpenAI API 키가 설정되어 있습니다. 실제 AI 분석을 사용합니다.'
          : '⚠️ OpenAI API 키가 없습니다. 데모 모드로 실행됩니다.'
        }
      </div>

      {/* 이미지 업로드 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#cccccc' }}>
          상품 이미지 선택
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: '#2a2a2a',
            color: '#ffffff'
          }}
        />
      </div>

      {/* 이미지 미리보기 */}
      {previewUrl && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src={previewUrl}
            alt="미리보기"
            style={{
              maxWidth: '300px',
              maxHeight: '300px',
              borderRadius: '8px',
              border: '2px solid #333'
            }}
          />
          <button
            onClick={clearImage}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🗑️ 이미지 제거
          </button>
        </div>
      )}

      {/* 분석 버튼 */}
      {selectedImage && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={analyzeImageWithGPT4Vision}
            disabled={isAnalyzing}
            style={{
              padding: '16px 32px',
              backgroundColor: isAnalyzing ? '#666' : '#007bff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer'
            }}
          >
            {isAnalyzing ? '🤖 AI 분석 중...' : '🔍 AI 분석 시작'}
          </button>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#dc3545',
          color: '#ffffff',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* 분석 결과 */}
      {analysisResults && (
        <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>📊 AI 분석 결과</h3>
          
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            
            {/* 기본 정보 */}
            <div>
              <h4 style={{ color: '#007bff', marginBottom: '10px' }}>🏷️ 기본 정보</h4>
              <div style={{ marginBottom: '10px' }}>
                <strong>카테고리:</strong> {analysisResults.category}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>브랜드:</strong> {analysisResults.brand}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>상태:</strong> {analysisResults.condition}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>AI 추천가:</strong> ₩{analysisResults.recommendedPrice.toLocaleString()}
              </div>
            </div>

            {/* 라벨 */}
            <div>
              <h4 style={{ color: '#007bff', marginBottom: '10px' }}>🏷️ 라벨</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {analysisResults.labels.map((label, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* 설명 */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ color: '#007bff', marginBottom: '10px' }}>📝 상품 설명</h4>
              <p style={{ lineHeight: '1.6', color: '#cccccc' }}>
                {analysisResults.description}
              </p>
            </div>

            {/* AI 분석 */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ color: '#007bff', marginBottom: '10px' }}>🤖 AI 분석</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {analysisResults.aiAnalysis.map((analysis, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid #333',
                      color: '#cccccc'
                    }}
                  >
                    • {analysis}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIImageAnalyzer; 