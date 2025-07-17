import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Notification {
  id?: string;
  userId: string;          // 알림 대상자
  message: string;         // 알림 내용
  createdAt: any;          // 생성 시간
  productId: string;       // 관련 상품 ID
  type: "거래완료" | "예약중" | "판매중";  // 알림 유형
  readAt?: any;            // 읽음 여부
}

/**
 * 거래완료 알림 생성 (개선된 버전)
 * @param productId 상품 ID
 * @param productName 상품명
 * @param sellerId 판매자 ID
 * @param sellerEmail 판매자 이메일
 */
export const createTransactionCompletedNotification = async (
  productId: string,
  productName: string,
  sellerId: string,
  sellerEmail: string
) => {
  try {
    console.log("🔔 거래완료 알림 생성 시작");
    console.log("상품:", productName);
    console.log("판매자:", sellerEmail);

    // 1. 판매자에게 알림 생성
    const sellerNotification: Omit<Notification, 'id'> = {
      userId: sellerId,
      message: `"${productName}" 거래가 완료되었습니다. 🎉`,
      createdAt: serverTimestamp(),
      productId: productId,
      type: "거래완료"
    };

    await addDoc(collection(db, 'notifications'), sellerNotification);
    console.log("✅ 판매자 알림 생성 완료");

    // 2. 해당 상품과 관련된 채팅방에서 참여자 찾기
    const chatsQuery = query(
      collection(db, 'chats'),
      where('productId', '==', productId)
    );
    
    const chatsSnapshot = await getDocs(chatsQuery);
    const participantIds = new Set<string>();

    chatsSnapshot.forEach(doc => {
      const chatData = doc.data();
      
      // 새로운 participants 배열 방식 지원
      if (chatData.participants && Array.isArray(chatData.participants)) {
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== sellerId) {
            participantIds.add(participantId);
          }
        });
      } else {
        // 기존 buyerId/sellerId 방식 지원 (하위 호환성)
        if (chatData.buyerId && chatData.buyerId !== sellerId) {
          participantIds.add(chatData.buyerId);
        }
      }
    });

    console.log("참여자 ID들:", Array.from(participantIds));

    // 3. 각 참여자에게 알림 생성
    const participantNotifications = Array.from(participantIds).map(participantId => ({
      userId: participantId,
      message: `"${productName}" 거래가 완료되었습니다. 🎉`,
      createdAt: serverTimestamp(),
      productId: productId,
      type: "거래완료"
    }));

    // 배치로 참여자 알림 생성
    for (const notification of participantNotifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }

    console.log(`✅ ${participantNotifications.length}명의 참여자에게 알림 생성 완료`);
    console.log("🎉 모든 거래완료 알림 생성 완료!");

  } catch (error) {
    console.error("❌ 거래완료 알림 생성 실패:", error);
    throw error;
  }
};

/**
 * 알림 읽음 처리
 * @param notificationId 알림 ID
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    // Firestore에서 알림 문서 업데이트
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'notifications', notificationId), {
      readAt: serverTimestamp()
    });
    console.log("✅ 알림 읽음 처리 완료");
  } catch (error) {
    console.error("❌ 알림 읽음 처리 실패:", error);
    throw error;
  }
};

/**
 * 사용자의 읽지 않은 알림 개수 조회
 * @param userId 사용자 ID
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('readAt', '==', null)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("❌ 읽지 않은 알림 개수 조회 실패:", error);
    return 0;
  }
};

/**
 * 채팅방 생성 시 participants 배열을 포함한 구조로 생성
 * @param buyerId 구매자 ID
 * @param sellerId 판매자 ID
 * @param productId 상품 ID
 * @param productName 상품명
 */
export const createChatWithParticipants = async (
  buyerId: string,
  sellerId: string,
  productId: string,
  productName: string
) => {
  try {
    const chatData = {
      buyerId: buyerId,
      sellerId: sellerId,
      productId: productId,
      productName: productName,
      participants: [buyerId, sellerId], // 참여자 배열 추가
      createdAt: serverTimestamp()
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    console.log("✅ participants 배열이 포함된 채팅방 생성 완료");
    return chatRef.id;
  } catch (error) {
    console.error("❌ 채팅방 생성 실패:", error);
    throw error;
  }
}; 