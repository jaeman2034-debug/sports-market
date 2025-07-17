import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../lib/firebaseConfig";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: any;
  productId: string;
  type: "거래완료" | "예약중" | "판매중";
  readAt?: any;
}

const NotificationSnackbar = () => {
  const [latest, setLatest] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // 로컬 스토리지에서 효과음 설정 불러오기
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const navigate = useNavigate();

  // ✅ 사용자 첫 클릭 이후 오디오 재생 허용
  useEffect(() => {
    const enableSound = () => setCanPlay(true);
    window.addEventListener("click", enableSound, { once: true });
    return () => window.removeEventListener("click", enableSound);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 최신 안 읽은 알림을 가져오는 쿼리
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("readAt", "==", null),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const unsubscribeSnap = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const latestDoc = snap.docs[0];
            const notificationData = { 
              id: latestDoc.id, 
              ...latestDoc.data() 
            } as Notification;
            
            // 이전 알림과 다른 경우에만 새 알림으로 표시
            if (latest?.id !== notificationData.id) {
              setLatest(notificationData);
              setIsVisible(true);
              
              // ✅ 효과음 재생
              if (canPlay && soundEnabled) {
                playNotificationSound();
              }
              
              // 5초 후 자동으로 사라짐
              setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setLatest(null), 300); // 애니메이션 완료 후 상태 초기화
              }, 5000);
            }
          }
        });

        return () => unsubscribeSnap();
      } else {
        setLatest(null);
        setIsVisible(false);
      }
    });

    return () => unsubscribeAuth();
  }, [latest?.id, canPlay, soundEnabled]);

  // ✅ 효과음 설정 토글 함수
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notificationSoundEnabled', JSON.stringify(newValue));
  };

  // ✅ 알림 효과음 재생 함수
  const playNotificationSound = () => {
    try {
      // Web Audio API를 사용하여 브라우저에서 직접 효과음 생성
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 효과음 설정
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // 0.1초 후 600Hz
      
      // 볼륨 설정 (부드러운 페이드 인/아웃)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // 연결 및 재생
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3); // 0.3초 후 정지
      
    } catch (error) {
      console.log('Web Audio API 효과음 재생 실패, 파일 효과음 시도:', error);
      
      // Web Audio API 실패 시 파일 효과음 시도
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch((fileError) => {
          console.log('파일 효과음 재생 실패 (정책 제한):', fileError);
        });
      } catch (fileError) {
        console.log('효과음 재생 중 오류:', fileError);
      }
    }
  };

  const handleClick = () => {
    if (latest?.productId) {
      // 알림을 읽음 처리
      if (!latest.readAt) {
        // 여기서는 읽음 처리를 하지 않고, 알림 목록에서 처리하도록 함
        console.log("알림 클릭:", latest.message);
      }
      
      // 관련 상품 페이지로 이동
      navigate(`/product/${latest.productId}`);
      
      // 팝업 닫기
      setIsVisible(false);
      setTimeout(() => setLatest(null), 300);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setIsVisible(false);
    setTimeout(() => setLatest(null), 300);
  };

  if (!latest || !isVisible) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "거래완료":
        return "✅";
      case "예약중":
        return "🔒";
      case "판매중":
        return "🛒";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "거래완료":
        return { bg: "#d4edda", border: "#c3e6cb", text: "#155724" };
      case "예약중":
        return { bg: "#fff3cd", border: "#ffeaa7", text: "#856404" };
      case "판매중":
        return { bg: "#d1ecf1", border: "#bee5eb", text: "#0c5460" };
      default:
        return { bg: "#e9ecef", border: "#dee2e6", text: "#6c757d" };
    }
  };

  const colors = getNotificationColor(latest.type);

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#1a1a1a",
          border: `2px solid ${colors.border}`,
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          cursor: "pointer",
          zIndex: 1000,
          maxWidth: "320px",
          minWidth: "280px",
          transform: isVisible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          animation: "slideIn 0.3s ease"
        }}
        onClick={handleClick}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            backgroundColor: "transparent",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: "16px",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#333";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#888";
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ 
            fontSize: "24px", 
            color: colors.text,
            marginTop: "2px"
          }}>
            {getNotificationIcon(latest.type)}
          </div>
          
          <div style={{ flex: 1, paddingRight: "20px" }}>
            <div style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "4px"
            }}>
              새 알림
            </div>
            
            <div style={{
              fontSize: "13px",
              color: "#cccccc",
              lineHeight: "1.4",
              marginBottom: "8px"
            }}>
              {latest.message}
            </div>
            
            <div style={{
              fontSize: "11px",
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>클릭하여 확인</span>
              <div style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#dc3545",
                borderRadius: "50%",
                animation: "pulse 2s infinite"
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </>
  );
};

export default NotificationSnackbar; 