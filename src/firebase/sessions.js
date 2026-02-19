import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db, hasConfig } from './config.js'
import { getCurrentUser } from './auth.js'

const SESSIONS_COLLECTION = 'sessions'

function sessionsRef() {
  const user = getCurrentUser()
  if (!user || !db) return null
  return collection(db, 'users', user.uid, SESSIONS_COLLECTION)
}

function toSession(docSnap) {
  const data = docSnap.data()
  if (!data) return null
  return {
    id: docSnap.id,
    durationSeconds: data.durationSeconds,
    completedAt: data.completedAt?.toDate?.()?.toISOString?.() ?? data.completedAt,
  }
}

export async function fetchSessions() {
  const ref = sessionsRef()
  if (!ref) return []
  const q = query(ref, orderBy('completedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toSession).filter(Boolean)
}

export function subscribeSessions(callback) {
  const ref = sessionsRef()
  if (!ref) {
    callback([])
    return () => {}
  }
  const q = query(ref, orderBy('completedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(toSession).filter(Boolean)
    callback(sessions)
  }, (err) => {
    console.error('Firestore subscribe error:', err)
    callback([])
  })
}

export async function addSessionFirestore(session) {
  const ref = sessionsRef()
  if (!ref) throw new Error('Not authenticated')
  const docRef = await addDoc(ref, {
    durationSeconds: session.durationSeconds,
    completedAt: session.completedAt
      ? Timestamp.fromDate(new Date(session.completedAt))
      : serverTimestamp(),
  })
  return { id: docRef.id, ...session }
}

export async function updateSessionFirestore(id, updates) {
  const user = getCurrentUser()
  if (!user || !db) throw new Error('Not authenticated')
  const ref = doc(db, 'users', user.uid, SESSIONS_COLLECTION, id)
  const data = {}
  if (updates.durationSeconds !== undefined) data.durationSeconds = updates.durationSeconds
  if (updates.completedAt !== undefined) {
    data.completedAt = Timestamp.fromDate(new Date(updates.completedAt))
  }
  await updateDoc(ref, data)
}

export async function deleteSessionFirestore(id) {
  const user = getCurrentUser()
  if (!user || !db) throw new Error('Not authenticated')
  const ref = doc(db, 'users', user.uid, SESSIONS_COLLECTION, id)
  await deleteDoc(ref)
}

export function isFirebaseEnabled() {
  return hasConfig && !!getCurrentUser()
}
