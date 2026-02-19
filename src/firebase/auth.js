import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import { auth, hasConfig, GoogleAuthProvider } from './config.js'

export function signInWithGoogle() {
  if (!hasConfig || !auth) return Promise.reject(new Error('Firebase not configured'))
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signOut() {
  if (!auth) return Promise.resolve()
  return firebaseSignOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser() {
  return auth?.currentUser ?? null
}
