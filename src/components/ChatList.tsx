import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc
} from 'firebase/firestore';
import { useAuthState } from "react-firebase-hooks/auth";

interface ChatRoom {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productName?: string;
  lastMessage?: string;
  lastMessageTime?: any;
  createdAt: any;
}

const ChatList = () => {
  const [user] = useAuthState(auth);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // 사용자가 구매자 또는 판매자인 채팅방 조회
    const buyerQuery = query(
      collection(db, 'chats'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const sellerQuery = query(
      collection(db, 'chats'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBuyer = onSnapshot(buyerQuery, (snapshot) => {
      const buyerChats = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as ChatRoom[];
      
      const unsubscribeSeller = onSnapshot(sellerQuery, (sellerSnapshot) => {
        const sellerChats = sellerSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as ChatRoom[];
        
        // 중복 제거 및 병합
        const allChats = [...buyerChats, ...sellerChats];
        const uniqueChats = allChats.filter((chat, index, self) => 
          index === self.findIndex(c => c.id === chat.id)
        );
        
        // 상품 정보 가져오기
        const fetchProductInfo = async () => {
          const chatsWithProductInfo = await Promise.all(
            uniqueChats.map(async (chat) => {
              try {
                const productDoc = await getDoc(doc(db, 'products', chat.productId));
                if (productDoc.exists()) {
                  return {
                    ...chat,
                    productName: productDoc.data().name
                  };
                }
                return chat;
              } catch (err) {
                console.error('상품 정보 가져오기 오류:', err);
                return chat;
              }
            })
          );
          setChatRooms(chatsWithProductInfo);
          setLoading(false);
        };
        
        fetchProductInfo();
      }, (err) => {
        setError('채팅방 목록을 불러올 수 없습니다.');
        console.error('판매자 채팅방 구독 오류:', err);
        setLoading(false);
      });

      return () => unsubscribeSeller();
    }, (err) => {
      setError('채팅방 목록을 불러올 수 없습니다.');
      console.error('구매자 채팅방 구독 오류:', err);
      setLoading(false);
    });

    return () => unsubscribeBuyer();
  }, [user]);

  const openChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
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
        채팅방 목록을 불러오는 중...
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
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      padding: "20px",
      color: "#ffffff"
    }}>
      <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "bold" }}>
        💬 내 채팅방
      </h2>
      
      {chatRooms.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          color: "#888", 
          padding: "40px 0" 
        }}>
          아직 채팅방이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {chatRooms.map(chat => (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              style={{
                backgroundColor: "#2a2a2a",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #333",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: "0 0 8px 0", 
                    fontSize: "16px", 
                    fontWeight: "bold",
                    color: "#ffffff"
                  }}>
                    {chat.productName || "상품명 없음"}
                  </h3>
                  <p style={{ 
                    margin: "0", 
                    fontSize: "14px", 
                    color: "#888" 
                  }}>
                    {chat.buyerId === user.uid ? "구매자" : "판매자"}로 참여 중
                  </p>
                  {chat.lastMessage && (
                    <p style={{ 
                      margin: "8px 0 0 0", 
                      fontSize: "14px", 
                      color: "#ccc",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {chat.lastMessage}
                    </p>
                  )}
                </div>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666",
                  textAlign: "right"
                }}>
                  {chat.createdAt && (
                    <div>
                      {chat.createdAt.toDate ? 
                        chat.createdAt.toDate().toLocaleDateString() : 
                        new Date(chat.createdAt).toLocaleDateString()
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList; 