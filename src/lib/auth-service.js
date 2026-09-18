import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Acceso unificado: el mismo login sirve para admin y cliente — el destino
// (panel admin o ficha de cliente) se decide después comprobando admins/{uid}.
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logoutAdmin() {
  return signOut(auth);
}
