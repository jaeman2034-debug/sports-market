import React, { useEffect, useState } from "react";
import { collectionGroup, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebaseConfig";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: any;
  chatId: string;
}

const ChatMessageSnackbar = () => {
  const [latest, setLatest] = useState<ChatMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
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

  // ✅ 채팅 메시지 효과음 재생 함수
  const playChatSound = () => {
    try {
      // Web Audio API를 사용하여 브라우저에서 직접 효과음 생성
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // 채팅용 효과음 설정 (알림과 다른 톤)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // 1000Hz
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1); // 0.1초 후 1200Hz
      
      // 볼륨 설정 (부드러운 페이드 인/아웃)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
      
      // 연결 및 재생
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25); // 0.25초 후 정지
      
    } catch (error) {
      console.log('채팅 효과음 재생 실패:', error);
      
      // Web Audio API 실패 시 파일 효과음 시도
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.4; // 채팅은 조금 더 작은 볼륨
        audio.play().catch((fileError) => {
          console.log('채팅 파일 효과음 재생 실패:', fileError);
        });
      } catch (fileError) {
        console.log('채팅 효과음 재생 중 오류:', fileError);
      }
    }
  };

  useEffect(() => {
    let unsubscribe: any;

    const init = async () => {
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user) {
          // 현재 사용자가 받는 메시지만 쿼리
          const q = query(
            collectionGroup(db, "messages"),
            where("receiverId", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          unsubscribe = onSnapshot(q, (snap) => {
            if (!snap.empty) {
              const doc = snap.docs[0];
              const data = doc.data();

              // 최신 메시지이고 이전 메시지와 다른 경우에만 알림 표시
              if (data && data.text && latest?.id !== doc.id) {
                const messageData = {
                  id: doc.id,
                  text: data.text,
                  senderId: data.senderId,
                  receiverId: data.receiverId,
                  createdAt: data.createdAt,
                  chatId: doc.ref.parent.parent?.id || ''
                } as ChatMessage;

                setLatest(messageData);
                setIsVisible(true);

                // ✅ 효과음 재생
                if (canPlay && soundEnabled) {
                  playChatSound();
                }

                // 5초 후 자동으로 사라짐
                setTimeout(() => {
                  setIsVisible(false);
                  setTimeout(() => setLatest(null), 300);
                }, 5000);
              }
            }
          }, (error) => {
            console.error('채팅 메시지 구독 오류:', error);
          });
        } else {
          setLatest(null);
          setIsVisible(false);
        }
      });

      return () => unsubscribeAuth();
    };

    init();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [canPlay, soundEnabled, latest?.id]);

  const handleClick = () => {
    if (latest?.chatId) {
      // 채팅방으로 이동
      navigate(`/chat/${latest.chatId}`);
      
      // 팝업 닫기
      setIsVisible(false);
      setTimeout(() => setLatest(null), 300);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => setLatest(null), 300);
  };

  if (!latest || !isVisible) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "100px", // 알림 팝업보다 위에 배치
          right: "24px",
          backgroundColor: "#1a1a1a",
          border: "2px solid #17a2b8",
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
            color: "#17a2b8",
            marginTop: "2px"
          }}>
            💬
          </div>
          
          <div style={{ flex: 1, paddingRight: "20px" }}>
            <div style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "4px"
            }}>
              새 메시지 도착
            </div>
            
            <div style={{
              fontSize: "13px",
              color: "#cccccc",
              lineHeight: "1.4",
              marginBottom: "8px",
              wordBreak: "break-word",
              maxWidth: "250px"
            }}>
              {latest.text.length > 50 
                ? `${latest.text.substring(0, 50)}...` 
                : latest.text
              }
            </div>
            
            <div style={{
              fontSize: "11px",
              color: "#888",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>클릭하여 채팅방 열기</span>
              <div style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#17a2b8",
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

export default ChatMessageSnackbar; 