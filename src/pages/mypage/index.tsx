import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebaseConfig';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';

export default function MyPage() {
  const [user] = useAuthState(auth);
  const unreadCount = useUnreadNotifications();

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

  const menuItems = [
    {
      icon: "📦",
      title: "내 상품 관리",
      description: "판매중, 예약중, 거래완료 상태별 관리",
      path: "/mypage/products",
      color: "#4f8cff"
    },
    {
      icon: "🛒",
      title: "전체 상품 목록",
      description: "모든 상품을 한눈에 확인",
      path: "/products",
      color: "#28a745"
    },
    {
      icon: "💬",
      title: "채팅 목록",
      description: "구매자와의 대화 관리",
      path: "/chats",
      color: "#17a2b8"
    },
    {
      icon: "🔔",
      title: "알림 목록",
      description: "거래 완료 등 알림 확인",
      path: "/mypage/notifications",
      color: "#ffc107",
      badge: unreadCount
    },
    {
      icon: "➕",
      title: "새 상품 등록",
      description: "AI 분석과 함께 상품 등록",
      path: "/product/upload",
      color: "#dc3545"
    }
  ];

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: "32px auto", 
      padding: 24, 
      backgroundColor: "#1a1a1a",
      borderRadius: 12,
      color: "#ffffff"
    }}>
      <h1 style={{ 
        margin: "0 0 24px 0", 
        fontSize: "24px", 
        fontWeight: "bold",
        color: "#ffffff"
      }}>
        👤 마이페이지
      </h1>
      
      {/* 메뉴 그리드 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "32px"
      }}>
        {menuItems.map((item, index) => (
          <Link key={index} to={item.path} style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "#2a2a2a",
              padding: "24px",
              borderRadius: "12px",
              border: `1px solid ${item.color}20`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 8px 25px ${item.color}30`;
              e.currentTarget.style.borderColor = `${item.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = `${item.color}20`;
            }}
            >
              {/* 배경 그라데이션 효과 */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                borderRadius: "12px 12px 0 0"
              }} />
              
              <div style={{ 
                fontSize: "32px", 
                marginBottom: "12px",
                color: item.color
              }}>
                {item.icon}
              </div>
              
              <h3 style={{ 
                margin: "0 0 8px 0", 
                fontSize: "18px", 
                color: "#ffffff",
                fontWeight: "600"
              }}>
                {item.title}
              </h3>
              
              <p style={{ 
                margin: 0, 
                color: "#888", 
                fontSize: "14px",
                lineHeight: "1.4"
              }}>
                {item.description}
              </p>

              {/* 알림 뱃지 */}
              {item.badge && item.badge > 0 && (
                <div style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  backgroundColor: "#dc3545",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  border: "2px solid #1a1a1a",
                  animation: "pulse 2s infinite",
                  boxShadow: "0 2px 8px rgba(220, 53, 69, 0.4)"
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {/* 사용자 정보 카드 */}
      <div style={{
        padding: "24px",
        backgroundColor: "#2a2a2a",
        borderRadius: "12px",
        border: "1px solid #333",
        background: "linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)"
      }}>
        <h3 style={{ 
          margin: "0 0 20px 0", 
          fontSize: "18px", 
          color: "#ffffff",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "20px" }}>👤</span>
          계정 정보
        </h3>
        
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px"
        }}>
          <div style={{ 
            padding: "12px 16px",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            border: "1px solid #333"
          }}>
            <div style={{ 
              color: "#888", 
              fontSize: "12px", 
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              이메일
            </div>
            <div style={{ 
              color: "#ffffff", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {user.email}
            </div>
          </div>
          
          <div style={{ 
            padding: "12px 16px",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            border: "1px solid #333"
          }}>
            <div style={{ 
              color: "#888", 
              fontSize: "12px", 
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              가입일
            </div>
            <div style={{ 
              color: "#ffffff", 
              fontSize: "14px",
              fontWeight: "500"
            }}>
              {user.metadata?.creationTime ? 
                new Date(user.metadata.creationTime).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "확인 불가"}
            </div>
          </div>
        </div>
      </div>

      {/* CSS 애니메이션 스타일 */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            }
            70% {
              transform: scale(1.1);
              box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
            }
          }
        `}
      </style>
    </div>
  );
} 