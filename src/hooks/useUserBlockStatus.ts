import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export function useUserBlockStatus() {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.data();
        if (data?.blocked === true) {
          setIsBlocked(true);
        } else {
          setIsBlocked(false);
        }
      } else {
        setIsBlocked(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return isBlocked;
} 