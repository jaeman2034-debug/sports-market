import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../lib/firebaseConfig';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { useAuthState } from "react-firebase-hooks/auth";
import { useUserBlockStatus } from "../hooks/useUserBlockStatus";

interface Message {
  id: string;
  senderId: string;
  senderEmail?: string;
  text: string;
  createdAt: any;
  isStatusRequest?: boolean;
  requestedStatus?: string;
}

interface ChatInfo {
  buyerId: string;
  sellerId: string;
  productId: string;
  productName?: string;
  createdAt: any;
}

interface ProductStatus {
  status?: "판매중" | "예약중" | "거래완료";
  name?: string;
  price?: number;
}

const ChatRoom = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [user] = useAuthState(auth);
  const isBlocked = useUserBlockStatus();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [productStatus, setProductStatus] = useState<ProductStatus | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!chatId || !user) return;

    // 채팅방 정보 가져오기
    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = { id: chatDoc.id, ...chatDoc.data() } as ChatInfo;
          setChatInfo(chatData);
          
          // 상품 정보 실시간 구독 설정
          if (chatData.productId) {
            const productRef = doc(db, 'products', chatData.productId);
            const productUnsubscribe = onSnapshot(productRef, (productSnap) => {
              if (productSnap.exists()) {
                const productData = productSnap.data();
                setProductStatus({
                  status: productData.status,
                  name: productData.name,
                  price: productData.price
                });
              }
            }, (err) => {
              console.error('상품 상태 구독 오류:', err);
            });
            
            // cleanup 함수에 상품 구독 해제 추가
            return () => productUnsubscribe();
          }
        }
      } catch (err: any) {
        setError('채팅방 정보를 불러올 수 없습니다.');
        console.error('채팅방 정보 오류:', err);
      }
    };

    // 실시간 메시지 구독
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      setError('메시지를 불러올 수 없습니다.');
      console.error('메시지 구독 오류:', err);
      setLoading(false);
    });

    const cleanup = fetchChatInfo();
    return () => {
      unsubscribe();
      if (cleanup) cleanup();
    };
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!text.trim() || !user || !chatId) return;
    
    // 거래완료 상태에서는 메시지 전송 불가
    if (productStatus?.status === "거래완료") {
      return;
    }

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderEmail: user.email,
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      setText('');
    } catch (err: any) {
      setError('메시지 전송에 실패했습니다.');
      console.error('메시지 전송 오류:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "판매중":
        return { bg: "#d4edda", text: "#155724", border: "#c3e6cb" };
      case "예약중":
        return { bg: "#fff3cd", text: "#856404", border: "#ffeaa7" };
      case "거래완료":
        return { bg: "#f8f9fa", text: "#6c757d", border: "#e9ecef" };
      default:
        return { bg: "#e9ecef", text: "#6c757d", border: "#dee2e6" };
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

  if (isBlocked) {
    return (
      <div className="p-6 text-center text-red-600 font-bold">
        🚫 차단된 계정은 채팅을 이용할 수 없습니다.
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
        채팅방을 불러오는 중...
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
      color: "#ffffff",
      height: "600px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* 채팅방 헤더 */}
      <div style={{
        borderBottom: "1px solid #333",
        paddingBottom: "12px",
        marginBottom: "16px"
      }}>
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
          💬 채팅방
        </h2>
        
        {/* 상품 정보 및 실시간 상태 */}
        {productStatus && (
          <div style={{
            margin: "8px 0 0 0",
            padding: "12px",
            backgroundColor: "#2a2a2a",
            borderRadius: "8px",
            border: "1px solid #333"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: "16px", 
                fontWeight: "600",
                color: "#ffffff"
              }}>
                {productStatus.name || chatInfo?.productName || "상품명"}
              </h3>
              {productStatus.price && (
                <span style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#007bff"
                }}>
                  ₩{productStatus.price.toLocaleString()}
                </span>
              )}
            </div>
            
            {/* 실시간 거래 상태 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{
                fontSize: "12px",
                color: "#888"
              }}>
                현재 상태:
              </span>
              <span style={{
                fontSize: "14px",
                padding: "4px 8px",
                borderRadius: "12px",
                backgroundColor: getStatusColor(productStatus.status).bg,
                color: getStatusColor(productStatus.status).text,
                border: `1px solid ${getStatusColor(productStatus.status).border}`,
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                {productStatus.status === "판매중" ? "🛒" : 
                 productStatus.status === "예약중" ? "🔒" : 
                 productStatus.status === "거래완료" ? "✅" : "⏳"}
                {productStatus.status || "확인 중..."}
              </span>
              <span style={{
                fontSize: "10px",
                color: "#666",
                fontStyle: "italic"
              }}>
                실시간 업데이트
              </span>
            </div>
          </div>
        )}
        
        {/* 기존 상품명 표시 (상품 정보가 없을 때) */}
        {!productStatus && chatInfo?.productName && (
          <p style={{ 
            margin: "4px 0 0 0", 
            fontSize: "14px", 
            color: "#888" 
          }}>
            상품: {chatInfo.productName}
          </p>
        )}
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        backgroundColor: "#2a2a2a",
        borderRadius: "8px",
        marginBottom: "16px",
        border: "1px solid #333"
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            color: "#888", 
            padding: "40px 0" 
          }}>
            첫 메시지를 보내보세요! 💬
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              marginBottom: "12px",
              display: "flex",
              justifyContent: msg.senderId === user.uid ? "flex-end" : "flex-start"
            }}>
              <div style={{
                maxWidth: "70%",
                padding: "8px 12px",
                borderRadius: "12px",
                backgroundColor: msg.isStatusRequest 
                  ? "#ffc107" 
                  : msg.senderId === user.uid ? "#007bff" : "#444",
                color: msg.isStatusRequest ? "#000000" : "#ffffff",
                wordBreak: "break-word",
                border: msg.isStatusRequest ? "2px solid #ff8c00" : "none"
              }}>
                <div style={{ fontSize: "12px", color: msg.isStatusRequest ? "#666" : "#ccc", marginBottom: "4px" }}>
                  {msg.senderEmail}
                </div>
                <div style={{ fontWeight: msg.isStatusRequest ? "bold" : "normal" }}>
                  {msg.text}
                </div>
                {msg.isStatusRequest && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666", 
                    marginTop: "4px",
                    fontStyle: "italic"
                  }}>
                    💡 상태 변경 요청 메시지입니다
                  </div>
                )}
                {msg.createdAt && (
                  <div style={{ 
                    fontSize: "10px", 
                    color: msg.isStatusRequest ? "#666" : "#aaa", 
                    marginTop: "4px",
                    textAlign: "right"
                  }}>
                    {msg.createdAt.toDate ? 
                      msg.createdAt.toDate().toLocaleTimeString() : 
                      new Date(msg.createdAt).toLocaleTimeString()
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메시지 입력 */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            productStatus?.status === "거래완료" 
              ? "거래가 완료되어 메시지를 보낼 수 없습니다." 
              : "메시지를 입력하세요..."
          }
          disabled={productStatus?.status === "거래완료"}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "2px solid #333",
            borderRadius: "8px",
            backgroundColor: productStatus?.status === "거래완료" ? "#1a1a1a" : "#2a2a2a",
            color: productStatus?.status === "거래완료" ? "#666" : "#ffffff",
            fontSize: "14px",
            outline: "none",
            cursor: productStatus?.status === "거래완료" ? "not-allowed" : "text"
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!text.trim() || productStatus?.status === "거래완료"}
          style={{
            padding: "12px 20px",
            backgroundColor: 
              productStatus?.status === "거래완료" 
                ? "#666" 
                : text.trim() 
                  ? "#007bff" 
                  : "#444",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: 
              productStatus?.status === "거래완료" || !text.trim() 
                ? "not-allowed" 
                : "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          {productStatus?.status === "거래완료" ? "거래완료" : "전송"}
        </button>
      </div>
      
      {/* 거래완료 안내 메시지 */}
      {productStatus?.status === "거래완료" && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "14px",
            color: "#6c757d",
            fontWeight: "600",
            marginBottom: "4px"
          }}>
            ✅ 거래가 완료되었습니다
          </div>
          <div style={{
            fontSize: "12px",
            color: "#888"
          }}>
            이 채팅방에서는 더 이상 메시지를 주고받을 수 없습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom; 