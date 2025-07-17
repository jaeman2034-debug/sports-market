import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";
import { useNavigate } from 'react-router-dom';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebaseConfig";

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
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

export default function MarketPage() {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "price-low" | "price-high">("latest");
  const [hideCompleted, setHideCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  // 검색, 필터링, 정렬 로직
  useEffect(() => {
    let filtered = [...products];
    
    // 거래완료 제외 필터
    if (hideCompleted) {
      filtered = filtered.filter(product => product.status !== "거래완료");
    }
    
    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sellerEmail && product.sellerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.aiCategory && product.aiCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.aiBrand && product.aiBrand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "latest":
        default:
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
      }
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy, hideCompleted]);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePurchase = (product: Product) => {
    const buyer = auth.currentUser;
    if (!buyer) return alert("로그인이 필요합니다.");

    console.log("✅ 구매 요청");
    console.log("상품:", product.name);
    console.log("판매자:", product.sellerEmail);
    console.log("구매자:", buyer.email);
  };

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: "32px auto", 
      padding: 24, 
      backgroundColor: "#1a1a1a",
      borderRadius: 12,
      color: "#ffffff"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px"
      }}>
        <h3 style={{ color: "#ffffff", margin: 0 }}>스포츠 마켓</h3>
      </div>
      
      {/* 검색 및 필터 */}
      {products.length > 0 && (
        <div style={{ 
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          {/* 검색 입력 */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <input
              type="text"
              placeholder="상품명, 설명, 판매자, 브랜드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #333",
                borderRadius: "8px",
                backgroundColor: "#2a2a2a",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
          
          {/* 정렬 선택 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "latest" | "price-low" | "price-high")}
            style={{
              padding: "12px 16px",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="latest">최신순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
          </select>
          
          {/* 거래완료 제외 체크박스 */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            whiteSpace: "nowrap"
          }}>
            <input
              type="checkbox"
              id="hideCompleted"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            <label htmlFor="hideCompleted" style={{ 
              fontSize: "14px",
              color: "#ffffff",
              cursor: "pointer"
            }}>
              거래완료 제외
            </label>
          </div>
          
          {/* 검색 결과 수 */}
          <div style={{ 
            fontSize: "14px", 
            color: "#888",
            whiteSpace: "nowrap"
          }}>
            {filteredProducts.length}개 상품
          </div>
        </div>
      )}
      
      {loading && <div style={{ textAlign: "center", color: "#cccccc" }}>불러오는 중...</div>}
      {error && <div style={{ color: "#ff6b6b", textAlign: "center", marginBottom: "16px" }}>{error}</div>}
      {products.length === 0 && !loading && (
        <div style={{ textAlign: "center", color: "#cccccc", padding: "40px" }}>
          등록된 상품이 없습니다.
        </div>
      )}
      
      {products.length > 0 && filteredProducts.length === 0 && !loading && (
        <div style={{ textAlign: "center", color: "#cccccc", padding: "40px" }}>
          검색 결과가 없습니다.
        </div>
      )}
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
        gap: "24px"
      }}>
        {filteredProducts.map(p => (
          <div key={p.id} style={{
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
          >
            
            {/* 상품 이미지 */}
            {(p.imageBase64 || p.imageUrl) && (
              <div style={{ 
                width: "100%", 
                height: "200px", 
                overflow: "hidden",
                position: "relative"
              }}
              onClick={() => navigate(`/product/${p.id}`)}
              >
                <img 
                  src={p.imageBase64 || p.imageUrl} 
                  alt={p.name}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover"
                  }} 
                />
                {/* 이미지 오버레이 - 판매자 정보 */}
                {p.sellerEmail && (
                  <div style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                    padding: "20px 16px 12px",
                    fontSize: "12px"
                  }}>
                    <div style={{ color: "#ccc" }}>판매자</div>
                    <div style={{ color: "#fff", fontWeight: "600" }}>{p.sellerEmail}</div>
                  </div>
                )}

                {/* 거래 상태 오버레이 */}
                {p.status && (
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    backgroundColor: getStatusColor(p.status).bg,
                    color: getStatusColor(p.status).text,
                    border: `1px solid ${getStatusColor(p.status).border}`,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    {p.status === "판매중" ? "🛒 판매중" : 
                     p.status === "예약중" ? "🔒 예약중" : "✅ 거래완료"}
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
                {p.name}
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
                {p.desc}
              </p>

              {/* 거래 상태 뱃지 - 상품 정보 아래 */}
              <div style={{ marginBottom: "12px" }}>
                <span style={{
                  fontSize: "12px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  backgroundColor: getStatusColor(p.status).bg,
                  color: getStatusColor(p.status).text,
                  border: `1px solid ${getStatusColor(p.status).border}`,
                  fontWeight: "500",
                  display: "inline-block"
                }}>
                  {p.status || "판매중"}
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
                  ₩{p.price.toLocaleString()}
                </p>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* AI 추천 가격 표시 */}
                  {p.aiRecommendedPrice && p.aiRecommendedPrice !== p.price && (
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#28a745",
                      backgroundColor: "#1a472a",
                      padding: "4px 8px",
                      borderRadius: "12px"
                    }}>
                      AI 추천: ₩{p.aiRecommendedPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* AI 분석 결과 (간소화) */}
              {p.aiAnalysis && p.aiAnalysis.length > 0 && (
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
                    {p.aiAnalysis.slice(0, 3).map((tag: string, index: number) => (
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
                    {p.aiAnalysis.length > 3 && (
                      <span style={{
                        backgroundColor: "#666",
                        color: "#ffffff",
                        padding: "2px 6px",
                        borderRadius: "8px",
                        fontSize: "10px"
                      }}>
                        +{p.aiAnalysis.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* 구매/채팅 버튼 */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handlePurchase(p)}
                  disabled={purchasing === p.id || p.status === "거래완료"}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    backgroundColor: purchasing === p.id || p.status === "거래완료" ? "#666" : "#007bff",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: purchasing === p.id || p.status === "거래완료" ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    boxShadow: purchasing === p.id || p.status === "거래완료" ? "none" : "0 2px 8px rgba(0, 123, 255, 0.3)"
                  }}
                  onMouseEnter={(e) => {
                    if (!purchasing && p.status !== "거래완료") {
                      e.currentTarget.style.backgroundColor = "#0056b3";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 123, 255, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!purchasing && p.status !== "거래완료") {
                      e.currentTarget.style.backgroundColor = "#007bff";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 123, 255, 0.3)";
                    }
                  }}
                >
                  {purchasing === p.id ? "구매중..." : p.status === "거래완료" ? "거래완료" : "구매하기"}
                </button>
                
                <button
                  onClick={() => navigate(`/product/${p.id}`)}
                  disabled={p.status === "거래완료"}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: p.status === "거래완료" ? "#666" : "#28a745",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: p.status === "거래완료" ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => {
                    if (p.status !== "거래완료") {
                      e.currentTarget.style.backgroundColor = "#218838";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (p.status !== "거래완료") {
                      e.currentTarget.style.backgroundColor = "#28a745";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {p.status === "거래완료" ? "완료" : "💬"}
                </button>
              </div>
              
              {/* 등록일 */}
              <div style={{ 
                fontSize: "11px", 
                color: "#666", 
                marginTop: "12px",
                textAlign: "center"
              }}>
                등록일: {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : "-"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 