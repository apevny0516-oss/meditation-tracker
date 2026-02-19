import { useState, useEffect, useCallback } from 'react'
import { onAuthChange } from '../firebase/auth.js'
import {
  subscribeSessions,
  addSessionFirestore,
  updateSessionFirestore,
  deleteSessionFirestore,
  fetchSessions,
} from '../firebase/sessions.js'
import {
  getSessions as getSessionsLocal,
  addSession as addSessionLocal,
  updateSession as updateSessionLocal,
  deleteSession as deleteSessionLocal,
} from '../utils/storage.js'

export function useSessions() {
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u)
      if (!u) {
        setSessions(getSessionsLocal())
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsubscribe = subscribeSessions((s) => {
      setSessions(s)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  const addSession = useCallback(
    async (session) => {
      if (user) {
        try {
          const added = await addSessionFirestore(session)
          setSessions((prev) => [added, ...prev])
        } catch (e) {
          setError(e.message)
          throw e
        }
      } else {
        const updated = addSessionLocal(session)
        setSessions(updated)
      }
    },
    [user]
  )

  const updateSession = useCallback(
    async (id, updates) => {
      if (user) {
        try {
          await updateSessionFirestore(id, updates)
          setSessions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
          )
        } catch (e) {
          setError(e.message)
          throw e
        }
      } else {
        const updated = updateSessionLocal(id, updates)
        setSessions(updated)
      }
    },
    [user]
  )

  const deleteSession = useCallback(
    async (id) => {
      if (user) {
        try {
          await deleteSessionFirestore(id)
          setSessions((prev) => prev.filter((s) => s.id !== id))
        } catch (e) {
          setError(e.message)
          throw e
        }
      } else {
        const updated = deleteSessionLocal(id)
        setSessions(updated)
      }
    },
    [user]
  )

  const getSessionsForExport = useCallback(() => {
    return user ? sessions : getSessionsLocal()
  }, [user, sessions])

  return {
    user,
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    getSessionsForExport,
  }
}
