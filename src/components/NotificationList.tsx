import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id?: string;
  userId: string;
  message: string;
  createdAt: any;
  productId: string;
  type: "거래완료" | "예약중" | "판매중";
  readAt?: any;
}

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type FilterType = "전체" | "안읽음" | "읽음";

const NotificationList = () => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>("전체");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Notification[];
      setNotifications(notifs);
      setLoading(false);
    }, (err) => {
      setError('알림을 불러올 수 없습니다.');
      console.error('알림 구독 오류:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id) return;

    // 이미 읽은 알림이 아니면 readAt 저장
    if (!notification.readAt) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { 
          readAt: serverTimestamp() 
        });
        console.log("✅ 알림 읽음 처리 완료");
      } catch (err) {
        console.error('알림 읽음 처리 실패:', err);
      }
    }

    // 관련 상품 페이지로 이동
    if (notification.productId) {
      navigate(`/product/${notification.productId}`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      // 안 읽은 알림만 쿼리
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("readAt", "==", null)
      );
      
      const snap = await getDocs(q);
      
      if (snap.empty) {
        console.log("읽지 않은 알림이 없습니다.");
        return;
      }
      
      // 배치 처리로 일괄 업데이트
      const batch = writeBatch(db);
      
      snap.docs.forEach((docRef) => {
        batch.update(docRef.ref, { 
          readAt: serverTimestamp() 
        });
      });
      
      await batch.commit();
      console.log(`✅ ${snap.size}개의 알림을 일괄 읽음 처리했습니다.`);
      
      // 성공 메시지 표시 (선택사항)
      alert(`${snap.size}개의 알림을 읽음으로 처리했습니다.`);
      
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
      alert('알림 읽음 처리 중 오류가 발생했습니다.');
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.readAt).length;
  };

  const getReadCount = () => {
    return notifications.filter(n => !!n.readAt).length;
  };

  // 필터링된 알림 목록
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "전체") return true;
    if (filter === "안읽음") return !notification.readAt;
    if (filter === "읽음") return !!notification.readAt;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "거래완료":
        return "✅";
      case "예약중":
        return "🔒";
      case "판매중":
        return "🛒";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) {
      return { 
        bg: "#2a2a2a", 
        text: "#888", 
        border: "#333",
        icon: "#666"
      };
    }
    
    switch (type) {
      case "거래완료":
        return { 
          bg: "#1a3a1a", 
          text: "#4ade80", 
          border: "#22c55e",
          icon: "#22c55e"
        };
      case "예약중":
        return { 
          bg: "#3a2a1a", 
          text: "#fbbf24", 
          border: "#f59e0b",
          icon: "#f59e0b"
        };
      case "판매중":
        return { 
          bg: "#1a2a3a", 
          text: "#60a5fa", 
          border: "#3b82f6",
          icon: "#3b82f6"
        };
      default:
        return { 
          bg: "#2a2a2a", 
          text: "#ffffff", 
          border: "#444",
          icon: "#888"
        };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '';
    }
  };

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

  if (loading) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "#ffffff",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px"
      }}>
        알림을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "20px", 
        textAlign: "center", 
        color: "#ff6b6b",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px"
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 800, 
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
        <div>
          <h1 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "24px", 
            fontWeight: "bold",
            color: "#ffffff"
          }}>
            🔔 알림 목록
          </h1>
          <div style={{ 
            fontSize: "14px", 
            color: "#888" 
          }}>
            총 {notifications.length}개 • 읽지 않은 알림 {getUnreadCount()}개
          </div>
        </div>

      </div>

      {/* 필터 탭과 전체 읽음 버튼 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px"
      }}>
        {/* 필터 탭 */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "4px",
          backgroundColor: "#2a2a2a",
          borderRadius: "8px",
          border: "1px solid #333",
          flex: 1
        }}>
          {(["전체", "안읽음", "읽음"] as FilterType[]).map((filterType) => {
            const isActive = filter === filterType;
            const count = filterType === "전체" ? notifications.length :
                         filterType === "안읽음" ? getUnreadCount() :
                         getReadCount();
            
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: isActive ? "#007bff" : "transparent",
                  color: isActive ? "#ffffff" : "#888",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "500",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#333";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#888";
                  }
                }}
              >
                <span>{filterType}</span>
                <span style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#333",
                  color: isActive ? "#ffffff" : "#666",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: "600",
                  minWidth: "20px",
                  textAlign: "center"
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 전체 읽음 처리 버튼 */}
        {getUnreadCount() > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: "10px 16px",
              backgroundColor: "#28a745",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#218838";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(40, 167, 69, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#28a745";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "14px" }}>✓</span>
            전체 읽음 처리
          </button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "#888",
          backgroundColor: "#2a2a2a",
          borderRadius: "12px",
          border: "1px solid #333"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔔</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#ffffff" }}>
            {filter === "전체" ? "알림이 없습니다" : 
             filter === "안읽음" ? "읽지 않은 알림이 없습니다" : 
             "읽은 알림이 없습니다"}
          </h3>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {filter === "전체" ? "새로운 거래나 업데이트가 있을 때 알림을 받을 수 있습니다." :
             filter === "안읽음" ? "모든 알림을 읽었습니다." :
             "아직 읽은 알림이 없습니다."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredNotifications.map((notification) => {
            const isRead = !!notification.readAt;
            const colors = getNotificationColor(notification.type, isRead);
            
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: "16px",
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  opacity: isRead ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isRead) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ 
                    fontSize: "20px", 
                    color: colors.icon,
                    marginTop: "2px"
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      margin: "0 0 8px 0", 
                      fontSize: "14px", 
                      color: colors.text,
                      lineHeight: "1.4"
                    }}>
                      {notification.message}
                    </p>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#666"
                    }}>
                      <span>{formatDate(notification.createdAt)}</span>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {isRead && (
                          <span style={{
                            color: "#22c55e",
                            fontSize: "11px",
                            fontWeight: "600",
                            backgroundColor: "#1a3a1a",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid #22c55e"
                          }}>
                            읽음
                          </span>
                        )}
                        
                        {!isRead && (
                          <div style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#dc3545",
                            borderRadius: "50%",
                            animation: "pulse 2s infinite"
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS 애니메이션 스타일 */}
      <style>
        {`
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
    </div>
  );
};

export default NotificationList; 