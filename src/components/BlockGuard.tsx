import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function BlockGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().blocked === true) {
          await auth.signOut();
          navigate("/blocked", { replace: true });
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return null;
} 