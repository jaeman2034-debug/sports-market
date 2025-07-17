import React from 'react';
import Navigation from './Navigation';
import NotificationSnackbar from './NotificationSnackbar';
import ChatMessageSnackbar from './ChatMessageSnackbar';
import BlockGuard from './BlockGuard';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <>
      <BlockGuard />
      <div style={{ 
        backgroundColor: '#0a0a0a', 
        minHeight: '100vh', 
        color: '#ffffff',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}>
        {/* 네비게이션 */}
        <Navigation />
        
        {/* 메인 콘텐츠 */}
        <div style={{ 
          paddingBottom: '50px',
          minHeight: 'calc(100vh - 100px)'
        }}>
          {children}
        </div>
        
        {/* 실시간 알림 팝업 */}
        <NotificationSnackbar />
        
        {/* 실시간 채팅 메시지 팝업 */}
        <ChatMessageSnackbar />
      </div>
    </>
  );
};

export default AppLayout; 