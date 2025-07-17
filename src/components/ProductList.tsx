// src/components/ProductList.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../lib/firebaseConfig";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { useAuthState } from "react-firebase-hooks/auth";
import "../App.css";

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
  image?: string; // Added image field
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

function ProductList() {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "price-low" | "price-high" | "distance">("latest");
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [userAddress, setUserAddress] = useState<string>("");
  const navigate = useNavigate();

  // 관리자 권한 체크 함수
  const isAdmin = () => {
    if (!user?.email) return false;
    
    // 환경변수에서 관리자 이메일 목록 가져오기
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    
    // 기본 관리자 이메일 (개발용)
    const defaultAdmins = ['admin@example.com', 'ljm@example.com'];
    
    const allAdminEmails = [...adminEmails, ...defaultAdmins];
    
    return allAdminEmails.includes(user.email);
  };

  useEffect(() => {
    fetchProducts();
    requestLocationPermission();
  }, []);

  // GPS 위치 권한 요청 및 현재 위치 가져오기
  const requestLocationPermission = () => {
    console.log("🔄 GPS 위치 권한 요청 시작");
    console.log("📍 navigator.geolocation 지원:", !!navigator.geolocation);
    
    if (!navigator.geolocation) {
      console.log("❌ GPS 기능을 지원하지 않는 브라우저입니다.");
      setLocationPermission("denied");
      return;
    }

    console.log("📍 GPS 위치 요청 중...");
    setLocationPermission("pending");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ GPS 위치 획득 성공:", { latitude, longitude });
        setUserLocation({ latitude, longitude });
        setLocationPermission("granted");
        console.log("📍 현재 위치 설정 완료:", { latitude, longitude });
        
        // 주소 정보 가져오기
        try {
          const address = await getAddressFromCoordinates(latitude, longitude);
          setUserAddress(address);
          console.log("📍 주소 변환 완료:", address);
        } catch (error) {
          console.error("❌ 주소 변환 실패:", error);
          const estimatedAddress = getEstimatedLocation(latitude, longitude);
          setUserAddress(estimatedAddress);
          console.log("📍 추정 주소 설정:", estimatedAddress);
        }
      },
      (error) => {
        console.error("❌ GPS 위치 가져오기 실패:", error);
        console.error("❌ 오류 코드:", error.code);
        console.error("❌ 오류 메시지:", error.message);
        
        let errorMessage = "알 수 없는 오류";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 권한이 거부되었습니다.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 요청 시간이 초과되었습니다.";
            break;
        }
        console.error("❌ 오류 설명:", errorMessage);
        
        setLocationPermission("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  };

  // 두 지점 간의 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // km
    return distance;
  };

  // 거리 포맷팅 함수
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  };

  // 좌표를 주소로 변환하는 함수
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // 카카오 지도 API를 사용하여 좌표를 주소로 변환
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
        {
          headers: {
            'Authorization': `KakaoAK ${import.meta.env.VITE_KAKAO_API_KEY || 'your_kakao_api_key'}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('주소 변환 실패');
      }
      
      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        const address = data.documents[0].address;
        // 행정구역명 추출 (예: "서울특별시 강남구 역삼동" -> "역삼동")
        const addressParts = address.address_name.split(' ');
        const dong = addressParts[addressParts.length - 1]; // 마지막 부분이 동/읍/면
        
        return dong;
      }
      
      return "위치 정보 없음";
    } catch (error) {
      console.error("주소 변환 오류:", error);
      
      // 카카오 API가 없을 경우 대체 방법: 주요 도시 좌표 범위로 추정
      return getEstimatedLocation(latitude, longitude);
    }
  };

  // 좌표 범위로 대략적인 위치 추정 (카카오 API 없을 때 사용)
  const getEstimatedLocation = (latitude: number, longitude: number): string => {
    // 서울 주요 지역
    if (latitude >= 37.413294 && latitude <= 37.715133 && 
        longitude >= 126.734086 && longitude <= 127.269311) {
      if (latitude >= 37.5 && longitude >= 127.0) return "강남구";
      if (latitude >= 37.5 && longitude < 127.0) return "서초구";
      if (latitude < 37.5 && longitude >= 127.0) return "광진구";
      return "서울시";
    }
    
    // 경기도 주요 지역
    if (latitude >= 37.0 && latitude <= 37.8 && 
        longitude >= 126.5 && longitude <= 127.5) {
      if (latitude >= 37.7 && longitude >= 127.0) return "의정부시";
      if (latitude >= 37.6 && longitude >= 127.0) return "남양주시";
      if (latitude >= 37.5 && longitude >= 127.0) return "구리시";
      if (latitude >= 37.7 && longitude < 127.0) return "고양시";
      return "경기도";
    }
    
    // 부산
    if (latitude >= 35.0 && latitude <= 35.3 && 
        longitude >= 128.9 && longitude <= 129.2) {
      return "부산시";
    }
    
    // 대구
    if (latitude >= 35.8 && latitude <= 36.0 && 
        longitude >= 128.4 && longitude <= 128.7) {
      return "대구시";
    }
    
    // 인천
    if (latitude >= 37.4 && latitude <= 37.6 && 
        longitude >= 126.4 && longitude <= 126.8) {
      return "인천시";
    }
    
    // 대전
    if (latitude >= 36.2 && latitude <= 36.4 && 
        longitude >= 127.3 && longitude <= 127.5) {
      return "대전시";
    }
    
    // 광주
    if (latitude >= 35.1 && latitude <= 35.2 && 
        longitude >= 126.8 && longitude <= 127.0) {
      return "광주시";
    }
    
    // 울산
    if (latitude >= 35.4 && latitude <= 35.6 && 
        longitude >= 129.2 && longitude <= 129.4) {
      return "울산시";
    }
    
    return "한국";
  };

  // 검색 및 필터링 로직
  useEffect(() => {
    let filtered = [...products];
    
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
        case "distance":
          if (userLocation && a.location && b.location) {
            const distanceA = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              a.location.latitude, a.location.longitude
            );
            const distanceB = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              b.location.latitude, b.location.longitude
            );
            return distanceA - distanceB;
          }
          return 0;
        case "latest":
        default:
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
      }
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("🔄 상품 목록 불러오기 시작...");
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      
      console.log("📦 불러온 상품 데이터:", items.map(item => ({
        id: item.id,
        name: item.name,
        hasImage: !!item.image,
        hasImageBase64: !!item.imageBase64,
        hasImageUrl: !!item.imageUrl,
        imageLength: item.image?.length || 0,
        imageBase64Length: item.imageBase64?.length || 0,
        imageUrlLength: item.imageUrl?.length || 0
      })));
      
      setProducts(items);
      console.log("✅ 상품 목록 불러오기 완료");
    } catch (e: any) {
      console.error("❌ 상품 목록 불러오기 실패:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllProducts = async () => {
    // 관리자 권한 재확인
    if (!isAdmin()) {
      alert("관리자 권한이 필요합니다.");
      return;
    }

    if (!window.confirm("정말로 모든 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setDeleting(true);
    setError("");
    
    try {
      console.log("관리자 권한으로 모든 상품 삭제 시작...");
      console.log("관리자:", user?.email);
      
      // 모든 상품 문서 가져오기
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);
      
      console.log(`총 ${snapshot.docs.length}개 상품 삭제 예정`);
      
      // 각 상품 삭제
      const deletePromises = snapshot.docs.map(async (docSnapshot) => {
        console.log(`상품 삭제 중: ${docSnapshot.id}`);
        await deleteDoc(doc(db, "products", docSnapshot.id));
      });
      
      await Promise.all(deletePromises);
      console.log("모든 상품 삭제 완료!");
      
      // 목록 새로고침
      setProducts([]);
      
    } catch (err: any) {
      console.error("상품 삭제 오류:", err);
      setError(`삭제 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log(`상품 삭제 중: ${productId}`);
      await deleteDoc(doc(db, "products", productId));
      console.log("상품 삭제 완료!");
      
      // 목록에서 제거
      setProducts(products.filter(p => p.id !== productId));
      
    } catch (err: any) {
      console.error("상품 삭제 오류:", err);
      setError(`삭제 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const handlePurchase = (product: Product) => {
    const buyer = auth.currentUser;
    if (!buyer) return alert("로그인이 필요합니다.");

    console.log("✅ 구매 요청");
    console.log("상품:", product.name);
    console.log("상품 ID:", product.id);
    console.log("판매자:", product.sellerEmail || "정보 없음");
    console.log("구매자:", buyer.email);
    
    // 상품 상세 페이지로 이동
    console.log("이동할 URL:", `/product/${product.id}`);
    navigate(`/product/${product.id}`);
  };

  // 시간 포맷팅 함수
  const formatTimeAgo = (seconds: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - seconds;
    
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}분 전`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}일 전`;
    }
  };

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h3 className="product-list-title">상품 목록</h3>
        
        <div className="header-actions">
          <button
            onClick={() => navigate('/product/upload')}
            className="add-product-button"
            title="상품 등록"
          >
            ➕
          </button>
          
          <button
            onClick={() => navigate('/product/upload-ai')}
            className="ai-camera-button"
            title="AI 촬영으로 상품 등록"
          >
            ✨
          </button>
          
          {products.length > 0 && isAdmin() && (
            <button
              onClick={deleteAllProducts}
              disabled={deleting}
              className="delete-all-button"
              title="관리자 전용: 모든 상품 삭제"
            >
              {deleting ? "삭제 중..." : "🗑️ 모든 상품 삭제"}
            </button>
          )}
        </div>
      </div>
      
      {/* 검색 및 필터 */}
      {products.length > 0 && (
        <div className="search-filter-container">
          {/* 검색 입력 */}
          <div className="search-input-container">
            <input
              type="text"
              placeholder="상품명, 설명, 판매자, 브랜드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* 정렬 선택 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "latest" | "price-low" | "price-high" | "distance")}
            className="sort-select"
          >
            <option value="latest">최신순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
            <option value="distance" disabled={!userLocation}>📍 거리순</option>
          </select>
          
          {/* 검색 결과 수 */}
          <div className="product-count">
            {filteredProducts.length}개 상품
          </div>
        </div>
      )}
      
      {/* GPS 상태 디버깅 정보 */}
      <div style={{ 
        marginBottom: "16px", 
        padding: "12px", 
        backgroundColor: "#333", 
        borderRadius: "8px",
        fontSize: "12px",
        color: "#ccc"
      }}>
        <strong>📍 GPS 상태:</strong><br />
        권한 상태: {locationPermission}<br />
        사용자 위치: {userLocation ? `위도: ${userLocation.latitude.toFixed(6)}, 경도: ${userLocation.longitude.toFixed(6)}` : "없음"}<br />
        현재 지역: {userAddress || "확인 중..."}<br />
        상품 수: {products.length}개<br />
        위치 정보 있는 상품: {products.filter(p => p.location).length}개
      </div>

      {loading && <div className="loading-message">불러오는 중...</div>}
      {error && <div className="error-message">{error}</div>}
      {products.length === 0 && !loading && (
        <div className="empty-message">
          등록된 상품이 없습니다.
        </div>
      )}
      
      {products.length > 0 && filteredProducts.length === 0 && !loading && (
        <div className="empty-message">
          검색 결과가 없습니다.
        </div>
      )}
      
      <div className="product-gallery">
        {filteredProducts.map(p => (
          <div key={p.id} className="gallery-item">
            
            {/* 상품 이미지 */}
            <div 
              className="gallery-image-container"
              onClick={() => {
                console.log("이미지 클릭 - 상품 ID:", p.id);
                console.log("이동할 URL:", `/product/${p.id}`);
                navigate(`/product/${p.id}`);
              }}
            >
              {(() => {
                // 이미지 데이터 디버깅
                console.log(`상품 ${p.id} 이미지 데이터:`, {
                  name: p.name,
                  hasImage: !!p.image,
                  hasImageBase64: !!p.imageBase64,
                  hasImageUrl: !!p.imageUrl,
                  image: p.image,
                  imageBase64Length: p.imageBase64?.length || 0,
                  imageUrl: p.imageUrl
                });
                
                // image 필드를 우선적으로 확인
                if (p.image && p.image.length > 0) {
                  return (
                    <img 
                      src={p.image} 
                      alt={p.name}
                      className="gallery-image"
                      onError={(e) => {
                        console.error(`이미지 로드 실패 - 상품 ${p.id}:`, e);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  );
                } else if (p.imageBase64 && p.imageBase64.length > 0) {
                  return (
                    <img 
                      src={p.imageBase64} 
                      alt={p.name}
                      className="gallery-image"
                      onError={(e) => {
                        console.error(`이미지 로드 실패 - 상품 ${p.id}:`, e);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  );
                } else if (p.imageUrl && p.imageUrl.length > 0) {
                  return (
                    <img 
                      src={p.imageUrl} 
                      alt={p.name}
                      className="gallery-image"
                      onError={(e) => {
                        console.error(`이미지 로드 실패 - 상품 ${p.id}:`, e);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  );
                } else {
                  return (
                    <div className="gallery-image-placeholder">
                      <span>이미지 없음</span>
                    </div>
                  );
                }
              })()}
              
              {/* 위치 정보 오버레이 */}
              {userLocation && p.location && (
                <div className="gallery-location-overlay">
                  📍 {formatDistance(calculateDistance(
                    userLocation.latitude, userLocation.longitude,
                    p.location.latitude, p.location.longitude
                  ))}
                </div>
              )}
              
              {/* 거래 상태 오버레이 */}
              {p.status && p.status !== "판매중" && (
                <div className={`gallery-status-overlay ${
                  p.status === "예약중" ? "status-reserved" : "status-completed"
                }`}>
                  {p.status === "예약중" ? "🔒 예약중" : "✅ 거래완료"}
                </div>
              )}
            </div>
            
            {/* 상품 정보 (간결하게) */}
            <div className="gallery-info">
              <h4 className="gallery-title" title={p.name}>
                {p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name}
              </h4>
              
              <div className="gallery-meta">
                <span className="gallery-location">
                  {p.sellerEmail ? p.sellerEmail.split('@')[0] : "판매자"}
                </span>
                <span className="gallery-time">
                  {p.createdAt ? formatTimeAgo(p.createdAt.seconds) : ""}
                </span>
              </div>

              <div className="gallery-price">
                ₩{p.price.toLocaleString()}
              </div>
              
              {/* 상호작용 버튼 */}
              <div className="gallery-actions">
                <button
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="gallery-chat-button"
                  title="채팅하기"
                >
                  💬
                </button>
                
                {user && p.sellerId === user.uid ? (
                  // 판매자: 삭제 버튼
                  p.status !== "거래완료" && (
                    <button
                      onClick={() => deleteProduct(p.id, p.name)}
                      className="gallery-delete-button"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  )
                ) : (
                  // 구매자: 구매 버튼
                  p.status !== "거래완료" && (
                    <button
                      onClick={() => handlePurchase(p)}
                      disabled={purchasing === p.id}
                      className="gallery-purchase-button"
                      title="구매하기"
                    >
                      {purchasing === p.id ? "구매중..." : "구매"}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductList;
