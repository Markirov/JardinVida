import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutAdmin() {
  return signOut(auth);
}
