import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../../lib/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  image?: string; // Firebase Storage URL
  imageUrl?: string;
  imageBase64?: string;
  aiAnalysis?: string[];
  aiRecommendedPrice?: number;
  aiCategory?: string;
  aiBrand?: string;
  aiCondition?: string;
  priceSatisfaction?: "satisfied" | "disappointed";
  sellerId?: string;
  sellerEmail?: string;
  status?: "판매중" | "예약중" | "거래완료";
  createdAt?: { seconds: number };
}

export default function MyProductList() {
  const [user] = useAuthState(auth);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchMyProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const q = query(
          collection(db, "products"), 
          where("sellerId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Product[];
        setAllProducts(products);
      } catch (err: any) {
        setError("상품을 불러오는 중 오류가 발생했습니다.");
        console.error("상품 조회 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [user]);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...allProducts];
    
    if (filter !== "전체") {
      filtered = filtered.filter(product => product.status === filter);
    }
    
    setFilteredProducts(filtered);
  }, [allProducts, filter]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "판매중":
        return { bg: "#d4edda", text: "#155724", border: "#c3e6cb" };
      case "예약중":
        return { bg: "#fff3cd", text: "#856404", border: "#ffeaa7" };
      case "거래완료":
        return { bg: "#f8f9fa", text: "#6c757d", border: "#e9ecef" };
      default:
        return { bg: "#e9ecef", text: "#6c757d", border: "#dee2e6" };
    }
  };

  const getStatusCount = (status: string) => {
    if (status === "전체") return allProducts.length;
    return allProducts.filter(product => product.status === status).length;
  };

  const tabs = [
    { key: "전체", label: "전체", icon: "📦" },
    { key: "판매중", label: "판매중", icon: "🛒" },
    { key: "예약중", label: "예약중", icon: "🔒" },
    { key: "거래완료", label: "거래완료", icon: "✅" }
  ];

  if (!user) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "#ffffff",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px"
      }}>
        로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: "32px auto", 
      padding: 24, 
      backgroundColor: "#1a1a1a",
      borderRadius: 12,
      color: "#ffffff"
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: "24px", 
          fontWeight: "bold",
          color: "#ffffff"
        }}>
          📦 내가 등록한 상품
        </h1>
        <button
          onClick={() => navigate("/upload")}
          style={{
            padding: "12px 20px",
            backgroundColor: "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ➕ 새 상품 등록
        </button>
      </div>

      {/* 상태별 필터 탭 */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "24px",
        flexWrap: "wrap"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "12px 20px",
              backgroundColor: filter === tab.key ? "#007bff" : "#2a2a2a",
              color: "#ffffff",
              border: filter === tab.key ? "2px solid #0056b3" : "2px solid #333",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
              minWidth: "120px",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              if (filter !== tab.key) {
                e.currentTarget.style.backgroundColor = "#3a3a3a";
                e.currentTarget.style.borderColor = "#555";
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== tab.key) {
                e.currentTarget.style.backgroundColor = "#2a2a2a";
                e.currentTarget.style.borderColor = "#333";
              }
            }}
          >
            <span style={{ fontSize: "16px" }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{
              backgroundColor: filter === tab.key ? "#ffffff" : "#444",
              color: filter === tab.key ? "#007bff" : "#888",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "bold",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {getStatusCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div style={{ 
          textAlign: "center", 
          color: "#cccccc", 
          padding: "40px" 
        }}>
          상품을 불러오는 중...
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div style={{ 
          color: "#ff6b6b", 
          textAlign: "center", 
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#2a1a1a",
          borderRadius: "8px",
          border: "1px solid #ff4444"
        }}>
          {error}
        </div>
      )}

      {/* 상품이 없을 때 */}
      {!loading && allProducts.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          color: "#cccccc", 
          padding: "60px 20px",
          backgroundColor: "#2a2a2a",
          borderRadius: "12px",
          border: "2px dashed #444"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
            등록된 상품이 없습니다
          </h3>
          <p style={{ margin: "0 0 20px 0", color: "#888" }}>
            첫 번째 상품을 등록해보세요!
          </p>
          <button
            onClick={() => navigate("/upload")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#007bff",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            상품 등록하기
          </button>
        </div>
      )}

      {/* 필터된 결과가 없을 때 */}
      {!loading && allProducts.length > 0 && filteredProducts.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          color: "#cccccc", 
          padding: "40px",
          backgroundColor: "#2a2a2a",
          borderRadius: "12px"
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>
            {filter === "판매중" ? "🛒" : 
             filter === "예약중" ? "🔒" : 
             filter === "거래완료" ? "✅" : "📦"}
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
            {filter} 상태의 상품이 없습니다
          </h3>
          <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
            다른 상태를 선택해보세요
          </p>
        </div>
      )}

      {/* 상품 목록 */}
      {filteredProducts.length > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: "24px"
        }}>
          {filteredProducts.map(product => (
            <div key={product.id} style={{
              backgroundColor: "#2a2a2a",
              borderRadius: "16px",
              padding: "0",
              border: "1px solid #333",
              color: "#ffffff",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
            onClick={() => navigate(`/product/${product.id}`)}
            >
              
              {/* 상품 이미지 */}
              {(product.image || product.imageBase64 || product.imageUrl) && (
                <div style={{ 
                  width: "100%", 
                  height: "200px", 
                  overflow: "hidden",
                  position: "relative"
                }}>
                  <img 
                    src={product.image || product.imageBase64 || product.imageUrl} 
                    alt={product.name}
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover"
                    }} 
                    onError={(e) => {
                      console.error("이미지 로드 실패:", e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  
                  {/* 거래 상태 오버레이 */}
                  {product.status && (
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      backgroundColor: getStatusColor(product.status).bg,
                      color: getStatusColor(product.status).text,
                      border: `1px solid ${getStatusColor(product.status).border}`,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backdropFilter: "blur(4px)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      {product.status === "판매중" ? "🛒 판매중" : 
                       product.status === "예약중" ? "🔒 예약중" : "✅ 거래완료"}
                    </div>
                  )}
                </div>
              )}
              
              {/* 상품 정보 */}
              <div style={{ padding: "20px" }}>
                <h4 style={{ 
                  marginBottom: "8px", 
                  color: "#ffffff", 
                  fontSize: "18px",
                  fontWeight: "600",
                  lineHeight: "1.3"
                }}>
                  {product.name}
                </h4>
                
                <p style={{ 
                  marginBottom: "12px", 
                  color: "#cccccc", 
                  fontSize: "14px",
                  lineHeight: "1.4",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {product.desc}
                </p>

                {/* 거래 상태 뱃지 */}
                <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    backgroundColor: getStatusColor(product.status).bg,
                    color: getStatusColor(product.status).text,
                    border: `1px solid ${getStatusColor(product.status).border}`,
                    fontWeight: "500",
                    display: "inline-block"
                  }}>
                    {product.status || "판매중"}
                  </span>
                </div>
                
                {/* 가격 정보 */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <p style={{ 
                    fontSize: "20px", 
                    fontWeight: "bold", 
                    color: "#007bff",
                    margin: 0
                  }}>
                    ₩{product.price.toLocaleString()}
                  </p>
                  
                  {/* AI 추천 가격 표시 */}
                  {product.aiRecommendedPrice && product.aiRecommendedPrice !== product.price && (
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#28a745",
                      backgroundColor: "#1a472a",
                      padding: "4px 8px",
                      borderRadius: "12px"
                    }}>
                      AI 추천: ₩{product.aiRecommendedPrice.toLocaleString()}
                    </div>
                  )}
                </div>
                
                {/* AI 분석 결과 (간소화) */}
                {product.aiAnalysis && product.aiAnalysis.length > 0 && (
                  <div style={{ 
                    marginBottom: "16px", 
                    padding: "12px", 
                    backgroundColor: "#1a472a", 
                    borderRadius: "8px",
                    border: "1px solid #28a745"
                  }}>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#28a745", 
                      marginBottom: "8px", 
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      🤖 AI 분석
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {product.aiAnalysis.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: "#28a745",
                            color: "#ffffff",
                            padding: "2px 6px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: "500"
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {product.aiAnalysis.length > 3 && (
                        <span style={{
                          backgroundColor: "#666",
                          color: "#ffffff",
                          padding: "2px 6px",
                          borderRadius: "8px",
                          fontSize: "10px"
                        }}>
                          +{product.aiAnalysis.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 등록일 */}
                <div style={{ 
                  fontSize: "11px", 
                  color: "#666", 
                  marginTop: "12px",
                  textAlign: "center"
                }}>
                  등록일: {product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 