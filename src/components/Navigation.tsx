import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebaseConfig';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

function Navigation() {
  const [user] = useAuthState(auth);
  const unreadCount = useUnreadNotifications();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navStyle = {
    backgroundColor: '#1a1a1a',
    padding: '16px 24px',
    borderBottom: '1px solid #333',
    marginBottom: '20px'
  };

  const navListStyle = {
    display: 'flex',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    gap: '20px',
    alignItems: 'center'
  };

  const navItemStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'background-color 0.2s'
  };

  const activeNavItemStyle = {
    ...navItemStyle,
    backgroundColor: '#007bff'
  };

  const userInfoStyle = {
    marginLeft: 'auto',
    color: '#cccccc',
    fontSize: '14px'
  };

  const logoutButtonStyle = {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '12px'
  };

  return (
    <nav style={navStyle}>
      <ul style={navListStyle}>
        <li>
          <Link 
            to="/" 
            style={isActive('/') ? activeNavItemStyle : navItemStyle}
          >
            홈
          </Link>
        </li>
        {!user ? (
          <li>
            <Link 
              to="/auth" 
              style={isActive('/auth') ? activeNavItemStyle : navItemStyle}
            >
              로그인/회원가입
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link 
                to="/products" 
                style={isActive('/products') ? activeNavItemStyle : navItemStyle}
              >
                상품 목록
              </Link>
            </li>
            <li>
              <Link 
                to="/product/upload" 
                style={isActive('/product/upload') ? activeNavItemStyle : navItemStyle}
              >
                상품 등록
              </Link>
            </li>
            <li>
              <Link 
                to="/chats" 
                style={isActive('/chats') ? activeNavItemStyle : navItemStyle}
              >
                💬 채팅
              </Link>
            </li>
            <li style={{ position: "relative" }}>
              <Link 
                to="/mypage/notifications" 
                style={isActive('/mypage/notifications') ? activeNavItemStyle : navItemStyle}
              >
                🔔 알림
              </Link>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#dc3545",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  border: "2px solid #1a1a1a"
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </li>
            <li>
              <Link 
                to="/market" 
                style={isActive('/market') ? activeNavItemStyle : navItemStyle}
              >
                스폰 장터
              </Link>
            </li>
            <li>
              <Link 
                to="/mypage" 
                style={isActive('/mypage') ? activeNavItemStyle : navItemStyle}
              >
                👤 마이페이지
              </Link>
            </li>
            <li>
              <Link 
                to="/club" 
                style={isActive('/club') ? activeNavItemStyle : navItemStyle}
              >
                운동 모임
              </Link>
            </li>
            <li>
              <Link 
                to="/job" 
                style={isActive('/job') ? activeNavItemStyle : navItemStyle}
              >
                체육 일자리
              </Link>
            </li>
            <li style={userInfoStyle}>
              {user.email}님
              <button 
                onClick={() => auth.signOut()}
                style={logoutButtonStyle}
              >
                로그아웃
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navigation; 