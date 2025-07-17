import React, { useState, useEffect, useRef, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../lib/firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// 이미지 압축 함수
const compressImageToFile = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 최대 크기 설정 (300px)
      const maxSize = 300;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 압축된 이미지를 File 객체로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', 0.8); // 80% 품질
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// 이미지 업로드 함수
const uploadImage = async (file: File): Promise<string> => {
  try {
    console.log("📸 이미지 업로드 시작...");
    console.log("📁 원본 파일 크기:", Math.round(file.size / 1024), "KB");
    
    // 이미지 압축
    const compressedFile = await compressImageToFile(file);
    console.log("📦 압축 후 파일 크기:", Math.round(compressedFile.size / 1024), "KB");
    
    // Firebase Storage에 업로드
    const storageRef = ref(storage, `product-images/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log("✅ 이미지 업로드 완료:", downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error("❌ 이미지 업로드 오류:", error);
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }
};

function ProductEdit() {
  const { productId } = useParams<{ productId: string }>();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageMode, setImageMode] = useState<'none' | 'new' | 'current'>('current');
  
  const isSubmittingRef = useRef(false);

  // 기존 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || !user) return;
      
      setLoading(true);
      try {
        const productRef = doc(db, 'products', productId);
        const productDoc = await getDoc(productRef);
        
        if (!productDoc.exists()) {
          setError('상품을 찾을 수 없습니다.');
          return;
        }
        
        const productData = productDoc.data();
        
        // 판매자 확인
        if (productData.sellerId !== user.uid) {
          setError('이 상품을 수정할 권한이 없습니다.');
          return;
        }
        
        // 폼 데이터 설정
        setName(productData.name || '');
        setDesc(productData.desc || '');
        setPrice(productData.price?.toString() || '');
        setCurrentImageUrl(productData.image || productData.imageUrl || null);
        
        console.log("✅ 상품 데이터 로드 완료");
      } catch (err: any) {
        console.error("❌ 상품 로드 오류:", err);
        setError(`상품 정보를 불러올 수 없습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [productId, user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📸 이미지 선택됨:", file.name, "크기:", Math.round(file.size / 1024), "KB");

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setImage(file);
    setImageMode('new');
    setError('');

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setImageMode('none');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !productId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (isSubmittingRef.current) {
      console.log("🚫 이미 제출 중입니다.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log("📝 상품 수정 시작...");
      
      let imageUrl = currentImageUrl; // 기존 이미지 URL 유지
      
      // 새 이미지가 선택된 경우 업로드
      if (image && imageMode === 'new') {
        console.log("📸 새 이미지 업로드 중...");
        imageUrl = await uploadImage(image);
      } else if (imageMode === 'none') {
        // 이미지 제거 선택
        imageUrl = null;
      }
      
      // Firestore 업데이트
      const productRef = doc(db, 'products', productId);
      const updateData: any = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        updatedAt: serverTimestamp()
      };
      
      if (imageUrl !== undefined) {
        updateData.image = imageUrl;
      }
      
      console.log("💾 Firestore 업데이트 시작...");
      await updateDoc(productRef, updateData);
      
      console.log("✅ 상품 수정 완료");
      setSuccess("상품이 성공적으로 수정되었습니다!");
      
      // 2초 후 상품 상세 페이지로 이동
      setTimeout(() => {
        navigate(`/product/${productId}`);
      }, 2000);
      
    } catch (error: any) {
      console.error("❌ 상품 수정 오류:", error);
      setError(`상품 수정에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading && !name) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "#ffffff",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px"
      }}>
        상품 정보를 불러오는 중...
      </div>
    );
  }

  if (error && !name) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "#ff6b6b",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px"
      }}>
        {error}
        <br />
        <button 
          onClick={() => navigate(-1)}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          뒤로가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#0a0a0a'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        maxWidth: 600, 
        margin: "32px auto", 
        padding: "32px", 
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        color: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>
          ✏️ 상품 수정
        </h3>
        
        {/* 성공 메시지 */}
        {success && (
          <div style={{
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "#28a745",
            color: "#ffffff",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            {success}
          </div>
        )}
        
        {/* 오류 메시지 */}
        {error && (
          <div style={{
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "#dc3545",
            color: "#ffffff",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            {error}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            상품 이미지
          </label>
          
          {/* 현재 이미지 표시 */}
          {currentImageUrl && imageMode !== 'new' && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                현재 이미지:
              </p>
              <img 
                src={currentImageUrl} 
                alt="현재 상품 이미지"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "2px solid #333"
                }}
              />
            </div>
          )}
          
          {/* 새 이미지 미리보기 */}
          {preview && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>
                새 이미지 (미리보기):
              </p>
              <img 
                src={preview} 
                alt="새 이미지 미리보기"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  borderRadius: "8px",
                  border: "2px solid #333"
                }}
              />
            </div>
          )}
          
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
            disabled={loading}
          />
          
          {/* 이미지 제거 버튼 */}
          {(currentImageUrl || preview) && (
            <button
              type="button"
              onClick={removeImage}
              style={{
                marginTop: "8px",
                padding: "8px 16px",
                backgroundColor: "#dc3545",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              🗑️ 이미지 제거
            </button>
          )}
          
          <div style={{ 
            marginTop: "8px", 
            fontSize: "12px", 
            color: "#888",
            backgroundColor: "#2a2a2a",
            padding: "8px",
            borderRadius: "4px"
          }}>
            📸 이미지 제한: 최대 10MB, 자동 압축
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ 
          display: "flex", 
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#444" : "#007bff",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              flex: 1
            }}
          >
            {loading ? "수정 중..." : "✅ 수정 완료"}
          </button>
          
          <button
            type="button"
            onClick={() => navigate(`/product/${productId}`)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            ← 취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProductEdit; 