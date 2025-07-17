import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function BlockedPage() {
  const [info, setInfo] = useState<{ reason?: string; date?: string }>({});
  const [requestMsg, setRequestMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      setInfo({
        reason: data?.blockedReason,
        date: data?.blockedAt?.toDate?.()?.toLocaleString(),
      });
    };
    fetchInfo();
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !requestMsg.trim()) return;
    await addDoc(collection(db, "unblockRequests"), {
      userId: user.uid,
      reason: requestMsg.trim(),
      createdAt: serverTimestamp(),
    });
    setSubmitted(true);
  };

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">🚫 이용 제한 안내</h1>
      <p className="text-gray-700 mb-2">
        회원님의 계정은 운영 정책에 따라 일시적으로 제한되었습니다.
      </p>
      {info.reason && <p className="text-sm mt-2">사유: <b>{info.reason}</b></p>}
      {info.date && <p className="text-sm text-gray-500">차단 일시: {info.date}</p>}

      {!submitted ? (
        <div className="mt-6 text-left">
          <h2 className="text-sm font-semibold mb-2">🔓 해제 요청하기</h2>
          <textarea
            rows={4}
            className="w-full border rounded p-2 mb-2"
            placeholder="운영자에게 전할 메시지를 입력하세요"
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-500 text-white rounded"
          >
            요청 제출
          </button>
        </div>
      ) : (
        <p className="text-green-600 mt-6 font-medium">
          요청이 정상적으로 제출되었습니다. 운영자가 검토 후 연락드립니다.
        </p>
      )}
    </div>
  );
} 