import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebaseConfig";

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("readAt", "==", null)
        );
        
        const unsubscribe = onSnapshot(q, (snap) => {
          setCount(snap.size); // 실시간으로 개수 업데이트
        }, (error) => {
          console.error("알림 구독 오류:", error);
          setCount(0);
        });
        
        return () => unsubscribe();
      } else {
        setCount(0);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return count;
} 