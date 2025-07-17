import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../lib/firebaseConfig';
import '../App.css';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { useAuthState } from "react-firebase-hooks/auth";
import { createTransactionCompletedNotification, createChatWithParticipants } from '../lib/notificationUtils';

interface Product {
  id: string;
  name: string;
  desc: string;
  price: number;
  image?: string; // Firebase Storage URL
  imageUrl?: string;
  imageBase64?: string;
  aiAnalysis?: string[];
  aiRecommendedPrice?: number;
  aiCategory?: string;
  aiBrand?: string;
  aiCondition?: string;
  priceSatisfaction?: "satisfied" | "disappointed";
  sellerId?: string;
  sellerEmail?: string;
  status?: "판매중" | "예약중" | "거래완료";
  createdAt?: { seconds: number };
}

interface Message {
  id: string;
  senderId: string;
  senderEmail: string;
  text: string;
  createdAt: any;
  isStatusRequest?: boolean;
  requestedStatus?: string;
}

const ProductDetail = () => {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();

  console.log('ProductDetail 컴포넌트 렌더링');
  console.log('전체 params:', params);
  console.log('productId:', productId);
  console.log('productId 타입:', typeof productId);

  useEffect(() => {
    console.log('ProductDetail useEffect 실행, productId:', productId);
    console.log('Firebase db 객체:', db);
    
    if (!productId) {
      console.log('productId가 없음');
      setError('상품 ID가 없습니다.');
      setLoading(false);
      return;
    }
    
    const fetchProduct = async () => {
      console.log('fetchProduct 함수 시작');
      setLoading(true);
      setError('');
      
      try {
        console.log('Firestore 문서 조회 시작:', productId);
        const productRef = doc(db, 'products', productId);
        console.log('문서 참조 생성 완료:', productRef);
        
        // Firebase 연결 테스트
        console.log('Firebase 연결 테스트 중...');
        const testQuery = await getDocs(collection(db, 'products'));
        console.log('Firebase 연결 성공, 총 상품 수:', testQuery.size);
        
        const productDoc = await getDoc(productRef);
        console.log('문서 조회 완료, exists:', productDoc.exists());
        
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product;
          console.log('상품 데이터 로드 완료:', productData);
          setProduct(productData);
        } else {
          console.log('상품을 찾을 수 없음:', productId);
          setError('상품을 찾을 수 없습니다.');
        }
      } catch (err: any) {
        console.error('상품 조회 오류:', err);
        console.error('오류 상세:', err.code, err.message);
        setError(`상품 정보를 불러올 수 없습니다: ${err.message}`);
      } finally {
        console.log('fetchProduct 완료, loading 상태 해제');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);



  const handleStatusChange = async (newStatus: "판매중" | "예약중" | "거래완료") => {
    if (!product?.id || !user) return;

    // 판매자만 상태 변경 가능
    if (product.sellerId !== user.uid) {
      alert("판매자만 거래 상태를 변경할 수 있습니다.");
      return;
    }

    setUpdatingStatus(true);
    try {
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // 거래완료 상태로 변경된 경우 알림 생성
      if (newStatus === "거래완료") {
        try {
          // 대안 구현 사용 (participants 배열 방식)
          await sendCompletionNotification();
          console.log("✅ 거래완료 알림 생성 완료");
        } catch (notificationError) {
          console.error("❌ 알림 생성 실패:", notificationError);
          // 알림 생성 실패해도 상태 변경은 성공으로 처리
        }
      }
      
      alert(`거래 상태가 "${newStatus}"(으)로 변경되었습니다.`);
      setProduct((prev: any) => ({ ...prev, status: newStatus }));
      
    } catch (err: any) {
      setError('상품 상태 변경에 실패했습니다.');
      console.error('상태 변경 오류:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const requestStatusChange = async (requestedStatus: "예약중" | "거래완료") => {
    if (!product || !user) return;

    // 자신의 상품은 요청할 수 없음
    if (product.sellerId === user.uid) {
      alert("자신이 등록한 상품은 요청할 수 없습니다.");
      return;
    }

    const confirmMessage = requestedStatus === "예약중" 
      ? "이 상품을 예약하시겠습니까? 판매자에게 예약 요청이 전송됩니다."
      : "거래를 완료하시겠습니까? 판매자에게 거래 완료 요청이 전송됩니다.";

    if (!window.confirm(confirmMessage)) return;

    try {
      // 상태 변경 요청을 채팅방에 메시지로 전송
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('sellerId', '==', product.sellerId),
        where('productId', '==', product.id)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      
      if (!existingChats.empty) {
        const chatId = existingChats.docs[0].id;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: user.uid,
          senderEmail: user.email,
          text: `[상태 변경 요청] ${requestedStatus}로 변경을 요청합니다.`,
          createdAt: serverTimestamp(),
          isStatusRequest: true,
          requestedStatus: requestedStatus
        });
        
        alert("판매자에게 상태 변경 요청을 전송했습니다. 채팅방에서 확인해주세요.");
        navigate(`/chat/${chatId}`);
      } else {
        alert("먼저 판매자와 채팅을 시작해주세요.");
      }
    } catch (err: any) {
      setError('상태 변경 요청에 실패했습니다.');
      console.error('상태 변경 요청 오류:', err);
    }
  };

  const startChat = async () => {
    if (!product || !user) return;

    // 자신의 상품과는 채팅할 수 없음
    if (product.sellerId === user.uid) {
      alert("자신이 등록한 상품과는 채팅할 수 없습니다.");
      return;
    }

    setChatLoading(true);
    try {
      // 기존 채팅방이 있는지 확인
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('sellerId', '==', product.sellerId),
        where('productId', '==', product.id)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      
      let chatId: string;
      
      if (!existingChats.empty) {
        // 기존 채팅방이 있으면 해당 채팅방 사용
        chatId = existingChats.docs[0].id;
      } else {
        // 새 채팅방 생성 (개선된 방식)
        const chatsRef = collection(db, 'chats');
        const newChat = await addDoc(chatsRef, {
          buyerId: user.uid,
          sellerId: product.sellerId,
          productId: product.id,
          productName: product.name,
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
      }
      
      // 채팅방으로 이동
      navigate(`/chat/${chatId}`);
      
    } catch (err: any) {
      setError('채팅방 생성에 실패했습니다.');
      console.error('채팅방 생성 오류:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const subscribeToMessages = (chatId: string) => {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messageList);
    }, (err) => {
      console.error('메시지 구독 오류:', err);
    });

    return unsubscribe;
  };

  const sendMessage = async () => {
    if (!currentChatId || !newMessage.trim() || !user) return;

    setSendingMessage(true);
    try {
      await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
        senderId: user.uid,
        senderEmail: user.email,
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });

      // 마지막 메시지 업데이트
      await updateDoc(doc(db, 'chats', currentChatId), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp()
      });

      setNewMessage('');
    } catch (err: any) {
      console.error('메시지 전송 오류:', err);
      setError('메시지를 전송할 수 없습니다.');
    } finally {
      setSendingMessage(false);
    }
  };

  const checkExistingChat = async () => {
    if (!product || !user || product.sellerId === user.uid) return;

    try {
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('sellerId', '==', product.sellerId),
        where('productId', '==', product.id)
      );
      
      const existingChats = await getDocs(existingChatQuery);
      
      if (!existingChats.empty) {
        const chatId = existingChats.docs[0].id;
        setCurrentChatId(chatId);
        subscribeToMessages(chatId);
        console.log("기존 채팅방 연결:", chatId);
      }
    } catch (err) {
      console.error('기존 채팅방 확인 오류:', err);
    }
  };

  // 기존 채팅방 확인
  useEffect(() => {
    if (product && user) {
      checkExistingChat();
    }
  }, [product, user]);


  // 거래완료 알림 전송 함수 (대안 구현)
  const sendCompletionNotification = async () => {
    if (!product?.id) return;
    
    try {
      const chatRef = collection(db, "chats");
      const q = query(chatRef, where("productId", "==", product.id));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const chat = snap.docs[0].data();
        const participants = chat.participants || []; // [판매자ID, 구매자ID]
        
        for (const uid of participants) {
          await addDoc(collection(db, "notifications"), {
            userId: uid,
            message: `"${product.name}" 거래가 완료되었습니다. 🎉`,
            createdAt: serverTimestamp(),
            productId: product.id,
            type: "거래완료",
          });
        }
        console.log(`✅ ${participants.length}명의 참여자에게 알림 전송 완료`);
      }
    } catch (error) {
      console.error("❌ 알림 전송 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div>상품 정보를 불러오는 중...</div>
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>
          productId: {productId}
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <div>{error || "상품을 찾을 수 없습니다."}</div>
        <div style={{ fontSize: '12px', marginTop: '8px', color: '#888' }}>
          productId: {productId}
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px', color: '#888' }}>
          loading: {loading.toString()}, error: {error || 'none'}
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* 상품 이미지 */}
      <div className="product-image-container">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="product-detail-image"
            onError={(e) => {
              console.error("이미지 로드 실패:", e);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : product.imageBase64 ? (
          <img
            src={product.imageBase64}
            alt={product.name}
            className="product-detail-image"
          />
        ) : product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-detail-image"
          />
        ) : (
          <div className="product-detail-no-image">
            이미지 없음
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div style={{ marginBottom: "24px" }}>
        <div className="product-info-header">
          <h1 className="product-detail-title">
            {product.name}
          </h1>
          
          {/* 거래 상태 */}
          <div className="status-controls">
            <div className="status-display">
              <span className={`status-badge-detail ${
                product.status === "판매중" ? "status-selling-detail" : 
                product.status === "예약중" ? "status-reserved-detail" : "status-completed-detail"
              }`}>
                현재 상태: <b>{product.status || "판매중"}</b>
              </span>
            </div>
          </div>

            {/* 🔐 판매자만 거래 상태 변경 가능 */}
            {user && product.sellerId === user.uid && (
              <div style={{ 
                display: "flex", 
                gap: "8px", 
                marginTop: "12px",
                flexWrap: "wrap"
              }}>
                <button 
                  onClick={() => handleStatusChange("판매중")}
                  disabled={updatingStatus || product.status === "판매중"}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: product.status === "판매중" ? "#444" : "#6c757d",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (updatingStatus || product.status === "판매중") ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  판매중
                </button>
                <button 
                  onClick={() => handleStatusChange("예약중")}
                  disabled={updatingStatus || product.status === "예약중"}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: product.status === "예약중" ? "#444" : "#ffc107",
                    color: product.status === "예약중" ? "#666" : "#000000",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (updatingStatus || product.status === "예약중") ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  예약중
                </button>
                <button 
                  onClick={() => handleStatusChange("거래완료")}
                  disabled={updatingStatus || product.status === "거래완료"}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: product.status === "거래완료" ? "#444" : "#dc3545",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (updatingStatus || product.status === "거래완료") ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  거래완료
                </button>
              </div>
            )}
        </div>

        <p style={{ 
          fontSize: "18px", 
          fontWeight: "bold", 
          color: "#007bff",
          margin: "16px 0"
        }}>
          ₩{product.price.toLocaleString()}
        </p>

        <p style={{ 
          fontSize: "16px", 
          lineHeight: "1.6",
          color: "#cccccc",
          marginBottom: "16px"
        }}>
          {product.desc}
        </p>

        {/* 판매자 정보 */}
        {user && product.sellerId !== user.uid && product.status !== "거래완료" && (
          <div style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#ffffff"
            }}>
              💬 판매자와 채팅하기
            </h3>
            <p style={{
              margin: "0 0 16px 0",
              fontSize: "14px",
              color: "#cccccc"
            }}>
              {product.sellerEmail}님과 실시간으로 대화하세요
            </p>
            <button
              onClick={startChat}
              disabled={chatLoading}
              style={{
                padding: "16px 32px",
                backgroundColor: chatLoading ? "#444" : "#007bff",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: chatLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "0 auto",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                if (!chatLoading) {
                  e.currentTarget.style.backgroundColor = "#0056b3";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={e => {
                if (!chatLoading) {
                  e.currentTarget.style.backgroundColor = "#007bff";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {chatLoading ? "채팅방 생성 중..." : "💬 시작하기"}
            </button>
          </div>
        )}

        {/* AI 분석 결과 */}
        {product.aiAnalysis && product.aiAnalysis.length > 0 && (
          <div style={{
            backgroundColor: "#2a2a2a",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            <h3 style={{ 
              margin: "0 0 12px 0", 
              fontSize: "16px", 
              fontWeight: "bold",
              color: "#ffffff"
            }}>
              🤖 AI 분석 결과
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {product.aiCategory && (
                <div>
                  <strong style={{ color: "#007bff" }}>카테고리:</strong> {product.aiCategory}
                </div>
              )}
              {product.aiBrand && (
                <div>
                  <strong style={{ color: "#007bff" }}>브랜드:</strong> {product.aiBrand}
                </div>
              )}
              {product.aiCondition && (
                <div>
                  <strong style={{ color: "#007bff" }}>상태:</strong> {product.aiCondition}
                </div>
              )}
              {product.aiRecommendedPrice && (
                <div>
                  <strong style={{ color: "#007bff" }}>AI 추천가:</strong> ₩{product.aiRecommendedPrice.toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ marginTop: "12px" }}>
              {product.aiAnalysis.map((analysis, index) => (
                <div key={index} style={{ 
                  fontSize: "14px", 
                  color: "#cccccc",
                  marginBottom: "4px"
                }}>
                  • {analysis}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

              {/* 액션 버튼 */}
        <div style={{ 
          display: "flex", 
          gap: "12px",
          flexWrap: "wrap"
        }}>
          {/* 채팅 버튼 (구매자만) */}
          {user && product.sellerId !== user.uid && (
            <button
              onClick={startChat}
              disabled={chatLoading || product.status === "거래완료"}
              style={{
                padding: "12px 24px",
                backgroundColor: chatLoading || product.status === "거래완료" ? "#444" : "#007bff",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: chatLoading || product.status === "거래완료" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {chatLoading ? "채팅방 생성 중..." : "💬 판매자와 채팅하기"}
            </button>
          )}

          {/* 상태 변경 요청 버튼 (구매자만) */}
          {user && product.sellerId !== user.uid && product.status === "판매중" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => requestStatusChange("예약중")}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#ffc107",
                  color: "#000000",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                🔒 예약 요청
              </button>
            </div>
          )}

          {/* 거래 완료 요청 버튼 (구매자만, 예약중 상태일 때) */}
          {user && product.sellerId !== user.uid && product.status === "예약중" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => requestStatusChange("거래완료")}
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#28a745",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                ✅ 거래 완료 요청
              </button>
            </div>
          )}

          {/* 구매 버튼 (구매자만) */}
          {user && product.sellerId !== user.uid && product.status !== "거래완료" && (
            <button
              onClick={() => {
                const buyer = auth.currentUser;
                if (!buyer) return alert("로그인이 필요합니다.");
                console.log("✅ 구매 요청");
                console.log("상품:", product.name);
                console.log("판매자:", product.sellerEmail);
                console.log("구매자:", buyer.email);
              }}
              style={{
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              🛒 구매하기
            </button>
          )}

          {/* 수정/삭제 버튼 (판매자만, 거래완료가 아닐 때) */}
          {user?.uid === product?.sellerId && product?.status !== "거래완료" && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => navigate(`/product/edit/${product.id}`)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                ✏️ 수정
              </button>
              <button
                onClick={() => {
                  if (window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
                    // 삭제 로직 구현
                    console.log("상품 삭제:", product.id);
                  }
                }}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#dc3545",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                🗑️ 삭제
              </button>
            </div>
          )}

          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate(-1)}
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
            ← 뒤로가기
          </button>
        </div>

        {/* 거래완료 메시지 */}
        {product?.status === "거래완료" && (
          <div style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            textAlign: "center"
          }}>
            <p style={{
              fontSize: "14px",
              color: "#6c757d",
              margin: 0,
              fontWeight: "500"
            }}>
              ✅ 이 상품은 거래가 완료되었습니다.
            </p>
            <p style={{
              fontSize: "12px",
              color: "#868e96",
              margin: "8px 0 0 0"
            }}>
              더 이상 구매나 채팅이 불가능합니다.
            </p>
          </div>
        )}

        {/* 채팅 대화창 */}
        {user && product && product.sellerId !== user.uid && product.status !== "거래완료" && (
          <div style={{
            marginTop: "30px",
            backgroundColor: "#1a1a1a",
            borderRadius: "12px",
            border: "1px solid #333",
            overflow: "hidden"
          }}>
            {/* 채팅 헤더 */}
            <div style={{
              padding: "16px 20px",
              backgroundColor: "#2a2a2a",
              borderBottom: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{
                margin: "0",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#ffffff"
              }}>
                💬 {product.sellerEmail}와의 채팅
              </h3>
              {currentChatId && (
                <span style={{
                  fontSize: "12px",
                  color: "#00ff00",
                  backgroundColor: "#1a1a1a",
                  padding: "4px 8px",
                  borderRadius: "4px"
                }}>
                  연결됨
                </span>
              )}
            </div>

            {/* 메시지 영역 */}
            <div style={{
              height: "300px",
              overflowY: "auto",
              padding: "16px",
              backgroundColor: "#0a0a0a"
            }}>
              {currentChatId ? (
                messages.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        style={{
                          alignSelf: message.senderId === user.uid ? "flex-end" : "flex-start",
                          maxWidth: "70%"
                        }}
                      >
                        <div style={{
                          backgroundColor: message.senderId === user.uid ? "#7bff00" : "#2a2a2a",
                          color: "#ffffff",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          wordBreak: "break-word"
                        }}>
                          {message.isStatusRequest ? (
                            <div>
                              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                                🔄 상태 변경 요청
                              </div>
                              <div>{message.text}</div>
                            </div>
                          ) : (
                            message.text
                          )}
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "#888",
                          marginTop: "4px",
                          textAlign: message.senderId === user.uid ? "right" : "left"
                        }}>
                          {message.senderEmail}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "40px 0"
                  }}>
                    아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                  </div>
                )
              ) : (
                <div style={{
                  textAlign: "center",
                  color: "#888",
                  padding: "40px 0"
                }}>
                  채팅을 시작하려면 💬 판매자와 채팅하기 버튼을 클릭하세요.
                </div>
              )}
            </div>

            {/* 메시지 입력 영역 */}
            {currentChatId && (
              <div style={{
                padding: "16px",
                backgroundColor: "#2a2a2a",
                borderTop: "1px solid #333",
                display: "flex",
                gap: "8"
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="메시지를 입력하세요..."
                  disabled={sendingMessage}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    backgroundColor: "#1a1a1a",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: newMessage.trim() && !sendingMessage ? "#7bff00" : "#444",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: newMessage.trim() && !sendingMessage ? "pointer" : "not-allowed"
                  }}
                >
                  {sendingMessage ? "전송 중..." : "전송"}
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default ProductDetail; 