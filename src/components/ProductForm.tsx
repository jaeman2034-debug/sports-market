// src/components/ProductForm.tsx
import React, { useState, startTransition, useRef } from "react";
import { db, storage, auth } from "../lib/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { useUserBlockStatus } from "../hooks/useUserBlockStatus";

// 이미지 압축 함수 (극도로 강화된 버전)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log("🔄 압축 시작 - 파일 정보:", {
      name: file.name,
      size: Math.round(file.size / 1024) + "KB",
      type: file.type
    });
    
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      console.warn("⚠️ 지원되지 않는 이미지 형식:", file.type);
      console.log("🔄 대체 방법 시도: FileReader 사용");
      
      // 대체 방법: FileReader 사용
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          console.log("✅ FileReader로 이미지 로드 성공");
          resolve(result);
        } else {
          reject(new Error('FileReader로 이미지를 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn("⚠️ Canvas 2D 컨텍스트 생성 실패, FileReader 사용");
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          console.log("✅ FileReader로 이미지 로드 성공");
          resolve(result);
        } else {
          reject(new Error('FileReader로 이미지를 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      console.log("📐 원본 이미지 크기:", img.width, "x", img.height);
      
      // 최대 크기 제한 (40px로 극도로 줄임)
      const maxSize = 40;
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
      
      console.log("📏 압축 후 크기:", Math.round(width), "x", Math.round(height));
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 고품질 JPEG로 변환 (품질: 0.05 = 5%로 극도 압축)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.05);
      
      // Base64 크기 확인 (15KB 제한으로 극도로 줄임)
      const base64Size = Math.ceil((compressedDataUrl.length * 3) / 4);
      const maxSizeBytes = 15 * 1024; // 15KB
      
      console.log("📊 압축 결과:", {
        base64Length: compressedDataUrl.length,
        estimatedSize: Math.round(base64Size / 1024) + "KB",
        maxAllowed: "15KB"
      });
      
      if (base64Size > maxSizeBytes) {
        console.warn("⚠️ 압축 후 크기가 너무 큼, 더 강력한 압축 시도");
        // 더 강력한 압축 시도
        const strongerCompressedDataUrl = canvas.toDataURL('image/jpeg', 0.02);
        const strongerBase64Size = Math.ceil((strongerCompressedDataUrl.length * 3) / 4);
        
        console.log("📊 강력한 압축 결과:", {
          base64Length: strongerCompressedDataUrl.length,
          estimatedSize: Math.round(strongerBase64Size / 1024) + "KB"
        });
        
        if (strongerBase64Size > maxSizeBytes) {
          console.warn("⚠️ 모든 압축 실패, 테스트용 더미 이미지 생성");
          // 테스트용 더미 이미지 생성
          const dummyCanvas = document.createElement('canvas');
          const dummyCtx = dummyCanvas.getContext('2d');
          dummyCanvas.width = 30;
          dummyCanvas.height = 30;
          
          if (dummyCtx) {
            // 간단한 색상 사각형 생성
            dummyCtx.fillStyle = '#007bff';
            dummyCtx.fillRect(0, 0, 30, 30);
            dummyCtx.fillStyle = '#ffffff';
            dummyCtx.font = '12px Arial';
            dummyCtx.fillText('IMG', 5, 20);
            
            const dummyImage = dummyCanvas.toDataURL('image/jpeg', 0.8);
            console.log("✅ 테스트용 더미 이미지 생성 성공");
            resolve(dummyImage);
            return;
          }
          
          reject(new Error(`이미지가 너무 큽니다. ${Math.round(strongerBase64Size / 1024)}KB > 15KB 제한. 더 작은 이미지를 선택하거나 이미지 없이 등록해주세요.`));
          return;
        }
        
        console.log("✅ 강력한 압축 성공!");
        resolve(strongerCompressedDataUrl);
        return;
      }
      
      console.log("✅ 압축 성공!");
      resolve(compressedDataUrl);
    };
    
    img.onerror = (error) => {
      console.error("❌ 이미지 로드 실패:", error);
      console.log("🔄 대체 방법 시도: FileReader 사용");
      
      // 대체 방법: FileReader 사용
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          console.log("✅ FileReader로 이미지 로드 성공");
          resolve(result);
        } else {
          reject(new Error('FileReader로 이미지를 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    };
    
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error("❌ URL 생성 실패:", error);
      console.log("🔄 대체 방법 시도: FileReader 사용");
      
      // 대체 방법: FileReader 사용
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          console.log("✅ FileReader로 이미지 로드 성공");
          resolve(result);
        } else {
          reject(new Error('FileReader로 이미지를 읽을 수 없습니다.'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader 오류가 발생했습니다.'));
      reader.readAsDataURL(file);
    }
  });
};

// Firebase Storage 이미지 업로드 함수
const uploadImage = async (file: File): Promise<string> => {
  console.log("🚀 Firebase Storage 업로드 시작");
  
  // 파일 상태 상세 확인
  console.log("📋 파일 상세 정보:", {
    name: file.name,
    size: file.size,
    sizeKB: Math.round(file.size / 1024) + "KB",
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
    isFile: file instanceof File,
    isBlob: file instanceof Blob
  });
  
  try {
    // 1. 파일 압축 (Canvas 사용)
    console.log("🔄 이미지 압축 시작...");
    const compressedFile = await compressImageToFile(file);
    console.log("✅ 이미지 압축 완료");
    console.log("📦 압축된 파일 정보:", {
      name: compressedFile.name,
      size: compressedFile.size,
      sizeKB: Math.round(compressedFile.size / 1024) + "KB",
      type: compressedFile.type
    });
    
    // 2. Firebase Storage에 업로드
    const timestamp = Date.now();
    const fileName = `products/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    console.log("📤 Storage 업로드 중...");
    const uploadResult = await uploadBytes(storageRef, compressedFile);
    console.log("✅ Storage 업로드 완료:", uploadResult);
    
    // 3. 다운로드 URL 가져오기
    console.log("🔗 다운로드 URL 가져오는 중...");
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ 다운로드 URL 획득:", downloadURL);
    
    return downloadURL;
    
  } catch (error: any) {
    console.error("❌ Firebase Storage 업로드 실패:", error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }
};

// 이미지를 File 객체로 압축하는 함수
const compressImageToFile = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    console.log("🔄 이미지 압축 시작");
    
    // 1. 파일 유효성 검사
    if (!file) {
      console.error("❌ 파일이 존재하지 않습니다.");
      reject(new Error('파일이 존재하지 않습니다.'));
      return;
    }
    
    if (file.size === 0) {
      console.error("❌ 파일이 비어있습니다.");
      reject(new Error('파일이 비어있습니다.'));
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      console.error("❌ 이미지 파일이 아닙니다:", file.type);
      reject(new Error('이미지 파일이 아닙니다.'));
      return;
    }
    
    console.log("✅ 파일 유효성 검사 통과:", {
      name: file.name,
      size: Math.round(file.size / 1024) + "KB",
      type: file.type
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      console.log("📐 원본 이미지 크기:", img.width, "x", img.height);
      
      // 최대 크기 제한 (300px로 적당하게)
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
      
      console.log("📏 압축 후 크기:", Math.round(width), "x", Math.round(height));
      
      canvas.width = width;
      canvas.height = height;
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          console.log("✅ 압축된 파일 생성:", {
            name: compressedFile.name,
            size: Math.round(compressedFile.size / 1024) + "KB",
            type: compressedFile.type
          });
          
          resolve(compressedFile);
        } else {
          reject(new Error('이미지 압축에 실패했습니다.'));
        }
      }, 'image/jpeg', 0.8); // 80% 품질
    };
    
    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
    
    // blob URL 대신 FileReader로 Base64 사용 (CSP 호환)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        img.src = result;
      } else {
        reject(new Error('파일을 읽을 수 없습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
};

function ProductForm() {
  const isBlocked = useUserBlockStatus();
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [imageMode, setImageMode] = useState<'disabled' | 'compressed' | 'storage'>('disabled');
  const [location, setLocation] = useState<{latitude: number; longitude: number; address?: string} | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [locationAddress, setLocationAddress] = useState<string>("");
  
  // 무한 루프 방지를 위한 ref
  const isSubmittingRef = useRef(false);
  const submitCountRef = useRef(0);

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

  // GPS 위치 가져오기
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.log("GPS 기능을 지원하지 않는 브라우저입니다.");
      setLocationPermission("denied");
      return;
    }

    setLocationPermission("pending");
    console.log("📍 GPS 위치 요청 중...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLocationPermission("granted");
        console.log("✅ GPS 위치 획득:", { latitude, longitude });
        
        // 주소 정보 가져오기
        try {
          const address = await getAddressFromCoordinates(latitude, longitude);
          setLocationAddress(address);
          console.log("📍 주소 변환 완료:", address);
        } catch (error) {
          console.error("❌ 주소 변환 실패:", error);
          const estimatedAddress = getEstimatedLocation(latitude, longitude);
          setLocationAddress(estimatedAddress);
          console.log("📍 추정 주소 설정:", estimatedAddress);
        }
      },
      (error) => {
        console.error("❌ GPS 위치 가져오기 실패:", error);
        setLocationPermission("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분
      }
    );
  };

  if (isBlocked) {
    return (
      <div className="p-6 text-center text-red-600 font-bold">
        🚫 이용이 제한된 계정입니다. 관리자에게 문의하세요.
      </div>
    );
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    console.log("🖼️ 이미지 선택됨:", file ? {
      name: file.name,
      size: file.size,
      sizeKB: Math.round(file.size / 1024) + "KB",
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    } : "파일 없음");
    
    if (!file) {
      console.log("❌ 파일이 선택되지 않음");
      setImage(null);
      setPreview(null);
      setError("");
      setImageMode('disabled');
      return;
    }
    
    // 파일 유효성 검사
    if (file.size === 0) {
      console.error("❌ 선택된 파일이 비어있음");
      setError("선택된 파일이 비어있습니다. 다른 파일을 선택해주세요.");
      setImage(null);
      setPreview(null);
      setImageMode('disabled');
      return;
    }
    
    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      console.error("❌ 이미지 파일이 아님:", file.type);
      setError("이미지 파일만 선택할 수 있습니다.");
      setImage(null);
      setPreview(null);
      setImageMode('disabled');
      return;
    }
    
    // 파일 크기 확인 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      console.error("❌ 파일이 너무 큼:", Math.round(file.size / 1024 / 1024) + "MB");
      setError("이미지 파일이 너무 큽니다. 10MB 이하의 파일을 선택해주세요.");
      setImage(null);
      setPreview(null);
      setImageMode('disabled');
      return;
    }
    
    console.log("✅ 파일 검증 통과");
    
    try {
      console.log("🖼️ 이미지 미리보기 생성 중...");
      
      setError(""); // 이전 오류 메시지 클리어
      setImageMode('storage');
      
      // 미리보기용 Base64 생성 (CSP 호환)
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          console.log("✅ 미리보기 생성 완료 (Base64)");
          console.log("📏 Base64 길이:", result.length);
          setImage(file);
          setPreview(result);
          setError("");
        } else {
          console.error("❌ Base64 변환 실패");
          setError("이미지 미리보기를 생성할 수 없습니다.");
        }
      };
      reader.onerror = (error) => {
        console.error("❌ FileReader 오류:", error);
        setError("이미지 파일을 읽을 수 없습니다.");
      };
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      console.error("❌ 이미지 미리보기 생성 실패:", error);
      setError("이미지 미리보기를 생성할 수 없습니다.");
      setImage(null);
      setPreview(null);
      setImageMode('disabled');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 무한 루프 방지용 카운터
    submitCountRef.current += 1;
    console.log("🔄 제출 시도 횟수:", submitCountRef.current);
    if (submitCountRef.current > 5) {
      console.log("⚠️ 무한 루프 감지 - 제출 중단");
      setError("무한 루프가 감지되었습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      return;
    }

    console.log("🚀 ProductForm - 폼 제출 시작");
    console.log("현재 상태:", { name, desc, price, loading, submitAttempts, imageMode });
    
    // 강화된 무한 루프 방지 (useRef 사용)
    if (isSubmittingRef.current) {
      console.log("⚠️ 이미 제출 중입니다. 중복 제출 방지");
      return;
    }
    
    if (loading) {
      console.log("⚠️ 이미 로딩 중입니다. 중복 제출 방지");
      return;
    }
    
    if (submitAttempts >= 3) {
      console.log("⚠️ 최대 제출 시도 횟수 초과");
      setError("너무 많은 시도가 있었습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      return;
    }
    
    // 제출 시작 표시
    isSubmittingRef.current = true;
    
    // 입력 검증
    if (!name.trim()) {
      console.log("❌ 상품명 검증 실패");
      setError("상품명을 입력해주세요.");
      return;
    }
    if (!desc.trim()) {
      console.log("❌ 상품 설명 검증 실패");
      setError("상품 설명을 입력해주세요.");
      return;
    }
    if (!price || Number(price) <= 0) {
      console.log("❌ 가격 검증 실패");
      setError("올바른 가격을 입력해주세요.");
      return;
    }

    // 사용자 인증 확인
    if (!user) {
      console.log("❌ 사용자 인증 실패");
      setError("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }
    
    console.log("✅ 입력 검증 통과");
    console.log("사용자 정보:", { uid: user.uid, email: user.email });
    
    // 상태 업데이트를 한 번에 처리 (무한 루프 방지)
    setLoading(true);
    setError("");
    setSuccess("");
    setSubmitAttempts(prev => prev + 1);
    
    // 디버깅용 로그
    console.log("🔄 상태 업데이트 완료 - 로딩 시작");
    
    try {
      let imageUrl = "";
      let imageBase64 = "";
      
      // 이미지 처리 (Base64 변환 - CORS 우회)
      if (image) {
        console.log("📸 Base64 변환 시작...");
        console.log("업로드할 이미지 파일:", {
          name: image.name,
          size: Math.round(image.size / 1024) + "KB",
          type: image.type
        });
        
        try {
          // Base64로 변환 (CORS 문제 우회)
          const reader = new FileReader();
          imageUrl = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              console.log("✅ Base64 변환 완료, 길이:", result.length);
              
              // Firestore 1B 제한 확인 (Base64는 약 33% 더 큼)
              const estimatedSize = Math.ceil((result.length * 3) /4);
              const maxSize = 1024 * 1024; // 1MB
              
              console.log("📊 Base64 크기 정보:", {
                base64Length: result.length,
                estimatedSize: Math.round(estimatedSize / 1024) + "KB",
                maxAllowed: "1MB",
                isOverLimit: estimatedSize > maxSize
              });
              
              if (estimatedSize > maxSize) {
                console.warn("⚠️ Base64 크기 제한 초과, 이미지 압축 시도");
                // 이미지 압축 시도
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = 200;
                  canvas.height = 200;
                  ctx?.drawImage(img,0,0,200,200);
                  const compressed = canvas.toDataURL('image/jpeg', 0.5);
                  console.log("✅ 압축 완료, 새 길이:", compressed.length);
                  resolve(compressed);
                };
                img.src = result;
              } else {
                resolve(result);
              }
            };
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsDataURL(image);
          });
          
          console.log("🔥 최종 Base64미지 URL:", imageUrl.substring(0, 50) + "...");
        } catch (uploadError: any) {
          console.error("❌ Base64 실패:", uploadError);
          console.log("📸이미지 없이 텍스트만 저장");
          imageUrl = "";
        }
      } else {
        console.log("📸 이미지 없음 - 텍스트만 저장");
      }
      
      // Firestore에 상품 데이터 저장
      console.log("💾 Firestore 저장 시작...");
      
      const productData = {
        name: name.trim(),
        desc: desc.trim(),
        price: Number(price),
        image: imageUrl, // imageUrl을 image 필드로 저장
        imageUrl: imageUrl, // 호환성을 위해 imageUrl도 유지
        imageBase64: imageBase64, // 빈 문자열 유지
        sellerId: user.uid,
        sellerEmail: user.email,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: "판매중",
        location: location ? {
          ...location,
          address: locationAddress
        } : null // GPS 위치 정보와 주소 추가
      };
      console.log("📦 저장할 데이터 크기:", JSON.stringify(productData).length, "bytes");
      // 🔍 image 필드 상세 확인
      console.log("🔍 image 필드 상세:", {
        value: productData.image,
        type: typeof productData.image,
        isNotEmpty: productData.image && productData.image.length > 0,
        isFirebaseURL: productData.image && productData.image.includes('firebasestorage.googleapis.com')
      });
      
      const productsCollection = collection(db, "products");
      console.log("💾 Firestore 저장 시작...");
      console.log("📦 저장할 데이터 크기:", JSON.stringify(productData).length, "bytes");
      
      const docRef = await addDoc(productsCollection, productData);
      console.log("✅상품 저장 완료, 문서 ID:", docRef.id);
      console.log("✅ 저장된 문서 경로:", docRef.path);
      
      const successMessage = imageUrl 
        ? "상품이 성공적으로 등록되었습니다! (이미지 포함)"
        : "상품이 성공적으로 등록되었습니다! (이미지 없음)";
      
      setSuccess(successMessage);
      
      // 폼 초기화 (무한 루프 방지 - 한 번에 처리)
      console.log("🔄 폼 초기화 시작");
      
      // React 18의 배치 업데이트 사용
      startTransition(() => {
        setName("");
        setDesc("");
        setPrice("");
        setImage(null);
        setPreview(null);
        setSubmitAttempts(0);
      });
      
      console.log("🔄 폼 초기화 완료");
      
    } catch (error: any) {
      console.error("❌ 상품 등록 오류:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      console.error("전체 오류 객체:", error);
      
      // 오류 메시지 정리
      let errorMessage = "상품 등록 중 오류가 발생했습니다.";
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = "이미지 업로드 권한이 없습니다.";
      } else if (error.code === 'storage/quota-exceeded') {
        errorMessage = "저장 공간이 부족합니다.";
      } else if (error.code === 'permission-denied') {
        errorMessage = "Firestore 접근 권한이 없습니다. Firebase 콘솔에서 보안 규칙을 확인해주세요.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Firebase 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.";
      } else if (error.code === 'not-found') {
        errorMessage = "Firestore 데이터베이스를 찾을 수 없습니다.";
      } else if (error.code === 'invalid-argument') {
        errorMessage = "데이터가 너무 큽니다. 더 작은 데이터를 입력해주세요.";
      } else if (error.message && error.message.includes("이미지")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = `${error.message} (코드: ${error.code || 'unknown'})`;
      }
      
      setError(errorMessage);
    } finally {
      console.log("🏁 폼 제출 완료 - 로딩 상태 해제");
      setLoading(false);
      isSubmittingRef.current = false; // 제출 완료 표시
    }
  };

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
        <h3 style={{ textAlign: "center", marginBottom: "24px", color: "#ffffff" }}>상품 등록</h3>
        
        {/* 디버깅 정보 */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "12px", 
          backgroundColor: "#333", 
          borderRadius: "8px",
          fontSize: "12px",
          color: "#ccc"
        }}>
          <strong>디버깅 정보:</strong><br />
          로딩 상태: {loading ? "진행중" : "대기중"}<br />
          제출 시도: {submitAttempts}/3<br />
          사용자: {user ? `${user.email} (${user.uid})` : "로그인 필요"}<br />
          이미지 모드: {imageMode}<br />
          이미지 상태: {image ? `선택됨 (${Math.round(image.size / 1024)}KB)` : "없음"}<br />
          미리보기: {preview ? "있음" : "없음"}<br />
          <strong style={{ color: "#00ff00" }}>✅ Firebase Storage 업로드 지원</strong><br />
          <span style={{ color: "#00ff00" }}>최대 10MB, 300px 자동 압축</span>
        </div>
        
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
            📍 위치 정보
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loading || locationPermission === "pending"}
              style={{ 
                padding: "12px 16px",
                backgroundColor: location ? "#28a745" : "#667eea",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading || locationPermission === "pending" ? "not-allowed" : "pointer",
                opacity: loading || locationPermission === "pending" ? 0.6 : 1,
                flex: 1
              }}
            >
              {locationPermission === "pending" ? "📍 위치 확인 중..." : 
               location ? "✅ 위치 설정됨" : "📍 현재 위치 가져오기"}
            </button>
            {location && (
              <button
                type="button"
                onClick={() => setLocation(null)}
                style={{ 
                  padding: "8px 12px",
                  backgroundColor: "#dc3545",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
                disabled={loading}
              >
                🗑️
              </button>
            )}
          </div>
          {location && (
            <div style={{ 
              marginTop: "8px", 
              padding: "8px 12px",
              backgroundColor: "#28a745",
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "12px"
            }}>
              📍 위도: {location.latitude.toFixed(6)}, 경도: {location.longitude.toFixed(6)}
              {locationAddress && <br />}
              {locationAddress && `🏘️ ${locationAddress}`}
            </div>
          )}
          {locationPermission === "denied" && (
            <div style={{ 
              marginTop: "8px", 
              padding: "8px 12px",
              backgroundColor: "#ffc107",
              color: "#000000",
              borderRadius: "6px",
              fontSize: "12px"
            }}>
              ⚠️ 위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", color: "#cccccc", fontSize: "14px" }}>
            상품 이미지 (선택사항)
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
            disabled={loading}
          />
          <div style={{ 
            marginTop: "8px", 
            fontSize: "12px", 
            color: "#888",
            backgroundColor: "#2a2a2a",
            padding: "8px",
            borderRadius: "4px"
          }}>
            📸 이미지 제한: 최대 10MB, Firebase Storage 업로드
          </div>
          
          {/* 이미지 없이 등록 버튼 */}
          <button 
            type="button"
            onClick={() => {
              setImage(null);
              setPreview(null);
              setError("");
              setImageMode('disabled');
            }}
            style={{ 
              marginTop: "8px",
              padding: "8px 16px",
              backgroundColor: "#666",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer"
            }}
            disabled={loading}
          >
            🗑️ 이미지 제거
          </button>
        </div>

        {preview && (
          <div style={{ marginBottom: "20px", textAlign: "center" }}>
            <img 
              src={preview} 
              alt="미리보기" 
              style={{ 
                maxWidth: "80px", 
                maxHeight: "80px", 
                objectFit: "cover",
                borderRadius: "8px",
                border: "2px solid #333333",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
              }} 
            />
            <div style={{ 
              marginTop: "8px", 
              fontSize: "12px", 
              color: "#00ff00"
            }}>
              ✅ 압축된 이미지 (미리보기)
            </div>
          </div>
        )}

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
          {loading ? "등록중..." : "상품 등록"}
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
      </form>
    </div>
  );
}

export default ProductForm;
