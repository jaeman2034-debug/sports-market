import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";

// 회원가입
export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// 로그인
export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// 로그아웃
export function logOut() {
  return signOut(auth);
} 