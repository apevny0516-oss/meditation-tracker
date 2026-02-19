import { useState, useEffect, useCallback, useRef } from 'react'
import { getTimerSettings, saveTimerSettings } from './utils/storage'
import { calculateCurrentStreak, calculateLongestStreak } from './utils/streaks'
import { exportSessionsToCSV } from './utils/export'
import { useSessions } from './hooks/useSessions'
import { signInWithGoogle, signOut } from './firebase/auth'
import { hasConfig } from './firebase/config'
import './App.css'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}

function formatSessionDuration(durationSeconds) {
  if (durationSeconds >= 60) {
    const m = Math.floor(durationSeconds / 60)
    const s = durationSeconds % 60
    return s ? `${m} min ${s} sec` : `${m} min`
  }
  return `${durationSeconds} sec`
}

function SessionRow({ session, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [editDate, setEditDate] = useState(
    () => new Date(session.completedAt).toISOString().slice(0, 10)
  )
  const [editTime, setEditTime] = useState(
    () => new Date(session.completedAt).toTimeString().slice(0, 5)
  )
  const [editMinutes, setEditMinutes] = useState(() => Math.floor(session.durationSeconds / 60))
  const [editSeconds, setEditSeconds] = useState(() => session.durationSeconds % 60)

  const handleSave = () => {
    const completedAt = new Date(`${editDate}T${editTime}:00`).toISOString()
    const durationSeconds = editMinutes * 60 + editSeconds
    if (durationSeconds > 0) {
      onUpdate(session.id, { completedAt, durationSeconds })
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditDate(new Date(session.completedAt).toISOString().slice(0, 10))
    setEditTime(new Date(session.completedAt).toTimeString().slice(0, 5))
    setEditMinutes(Math.floor(session.durationSeconds / 60))
    setEditSeconds(session.durationSeconds % 60)
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="session-item session-item-editing">
        <div className="session-edit-fields">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="session-edit-input"
          />
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="session-edit-input"
          />
          <div className="session-edit-duration">
            <input
              type="number"
              min={0}
              max={999}
              value={editMinutes}
              onChange={(e) => setEditMinutes(clamp(parseInt(e.target.value, 10) || 0, 0, 999))}
              className="session-edit-input session-edit-input-sm"
            />
            <span>min</span>
            <input
              type="number"
              min={0}
              max={59}
              value={editSeconds}
              onChange={(e) => setEditSeconds(clamp(parseInt(e.target.value, 10) || 0, 0, 59))}
              className="session-edit-input session-edit-input-sm"
            />
            <span>sec</span>
          </div>
        </div>
        <div className="session-edit-actions">
          <button type="button" className="btn btn-icon btn-save" onClick={handleSave} title="Save">
            ✓
          </button>
          <button type="button" className="btn btn-icon btn-ghost" onClick={handleCancel} title="Cancel">
            ✕
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="session-item">
      <span className="session-date">
        {new Date(session.completedAt).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
      <span className="session-time">
        {new Date(session.completedAt).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
      <span className="session-duration">{formatSessionDuration(session.durationSeconds)}</span>
      <div className="session-actions">
        <button
          type="button"
          className="btn btn-icon btn-edit"
          onClick={() => setEditing(true)}
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          className="btn btn-icon btn-delete"
          onClick={() => onDelete(session.id)}
          title="Delete"
        >
          ×
        </button>
      </div>
    </li>
  )
}

function App() {
  const { user, sessions, loading, error: sessionError, clearError, addSession, updateSession, deleteSession, getSessionsForExport } = useSessions()
  const [durationMinutes, setDurationMinutes] = useState(() => getTimerSettings()?.minutes ?? 10)
  const [durationSeconds, setDurationSeconds] = useState(() => getTimerSettings()?.seconds ?? 0)
  const totalDurationSeconds = durationMinutes * 60 + durationSeconds
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [initialDuration, setInitialDuration] = useState(totalDurationSeconds)

  const currentStreak = calculateCurrentStreak(sessions)
  const longestStreak = calculateLongestStreak(sessions)
  const elapsedSeconds = initialDuration - timeLeft
  const hasElapsedTime = elapsedSeconds > 0

  const hasLoggedCompletion = useRef(false)
  const bellRef = useRef(null)

  const unlockAudio = useCallback(() => {
    try {
      const audio = bellRef.current || new Audio(import.meta.env.BASE_URL + 'gong.mp3')
      if (!bellRef.current) bellRef.current = audio
      const wasUnlocked = audio.dataset.unlocked === '1'
      if (!wasUnlocked) {
        audio.volume = 0
        audio.play().then(() => {
          audio.pause()
          audio.currentTime = 0
          audio.volume = 1
          audio.dataset.unlocked = '1'
        }).catch(() => {})
      }
    } catch {}
  }, [])

  const playBell = useCallback(() => {
    try {
      const audio = bellRef.current || new Audio(import.meta.env.BASE_URL + 'gong.mp3')
      if (!bellRef.current) bellRef.current = audio
      audio.currentTime = 0
      audio.volume = 1
      audio.play().catch(() => {})
    } catch {}
  }, [])

  useEffect(() => {
    if (isRunning) hasLoggedCompletion.current = false
  }, [isRunning])

  useEffect(() => {
    if (!isRunning) {
      const total = Math.max(1, durationMinutes * 60 + durationSeconds)
      setTimeLeft(total)
      setInitialDuration(total)
    }
  }, [durationMinutes, durationSeconds, isRunning])

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasLoggedCompletion.current) {
            hasLoggedCompletion.current = true
            addSession({
              durationSeconds: initialDuration,
              completedAt: new Date().toISOString(),
            })
            playBell()
          }
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, initialDuration, playBell, addSession])

  const start = useCallback(() => {
    unlockAudio()
    setInitialDuration((prev) => (timeLeft > 0 ? timeLeft : totalDurationSeconds))
    setTimeLeft((prev) => (prev > 0 ? prev : totalDurationSeconds))
    setIsRunning(true)
  }, [totalDurationSeconds, timeLeft, unlockAudio])

  const pause = useCallback(() => setIsRunning(false), [])

  const stopAndLog = useCallback(() => {
    if (elapsedSeconds > 0) {
      addSession({
        durationSeconds: elapsedSeconds,
        completedAt: new Date().toISOString(),
      })
    }
    setIsRunning(false)
    const total = Math.max(1, durationMinutes * 60 + durationSeconds)
    setTimeLeft(total)
    setInitialDuration(total)
  }, [elapsedSeconds, durationMinutes, durationSeconds, addSession])

  const reset = useCallback(() => {
    setIsRunning(false)
    const total = Math.max(1, durationMinutes * 60 + durationSeconds)
    setTimeLeft(total)
    setInitialDuration(total)
  }, [durationMinutes, durationSeconds])

  const handleExport = useCallback(() => {
    exportSessionsToCSV(getSessionsForExport())
  }, [getSessionsForExport])

  const handleDeleteSession = useCallback((id) => {
    deleteSession(id)
  }, [deleteSession])

  const handleUpdateSession = useCallback((id, updates) => {
    updateSession(id, updates)
  }, [updateSession])

  const progress = initialDuration > 0 ? ((initialDuration - timeLeft) / initialDuration) * 100 : 0

  const [authLoading, setAuthLoading] = useState(false)
  const handleSignIn = useCallback(async () => {
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error('Sign in failed:', e)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    setAuthLoading(true)
    try {
      await signOut()
    } finally {
      setAuthLoading(false)
    }
  }, [])

  return (
    <div className="app">
      {sessionError && (
        <div className="error-banner">
          Could not save session: {sessionError}. Check that Firestore rules are deployed.
          <button type="button" className="error-dismiss" onClick={clearError} aria-label="Dismiss">×</button>
        </div>
      )}
      <header className="header">
        <div className="header-row">
          <div>
            <h1>Meditation Timer</h1>
            <p className="subtitle">Breathe. Focus. Grow.</p>
          </div>
          {hasConfig && (
            <div className="auth-actions">
              {user ? (
                <div className="user-info">
                  <img src={user.photoURL} alt="" className="user-avatar" />
                  <span className="user-name">{user.displayName}</span>
                  <button className="btn btn-ghost btn-sm" onClick={handleSignOut} disabled={authLoading}>
                    Sign out
                  </button>
                </div>
              ) : (
                <button className="btn btn-google" onClick={handleSignIn} disabled={authLoading}>
                  {authLoading ? '...' : 'Sign in with Google'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="streaks">
        <div className="streak-card current">
          <span className="streak-value">{currentStreak}</span>
          <span className="streak-label">Current Streak</span>
          <span className="streak-unit">days</span>
        </div>
        <div className="streak-card longest">
          <span className="streak-value">{longestStreak}</span>
          <span className="streak-label">Longest Streak</span>
          <span className="streak-unit">days</span>
        </div>
      </section>

      <section className="timer-section">
        <div className="duration-selector">
          <label>Duration</label>
          <div className="duration-inputs">
            <div className="duration-field">
              <input
                type="number"
                min={0}
                max={999}
                value={durationMinutes}
                onChange={(e) => {
                  if (!isRunning) {
                    const v = clamp(parseInt(e.target.value, 10) || 0, 0, 999)
                    setDurationMinutes(v)
                    saveTimerSettings(v, durationSeconds)
                  }
                }}
                disabled={isRunning}
              />
              <span>min</span>
            </div>
            <div className="duration-field">
              <input
                type="number"
                min={0}
                max={59}
                value={durationSeconds}
                onChange={(e) => {
                  if (!isRunning) {
                    const v = clamp(parseInt(e.target.value, 10) || 0, 0, 59)
                    setDurationSeconds(v)
                    saveTimerSettings(durationMinutes, v)
                  }
                }}
                disabled={isRunning}
              />
              <span>sec</span>
            </div>
          </div>
        </div>

        <div className="timer-display">
          <div className="timer-ring" style={{ '--progress': progress }}>
            <span className="timer-value">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="timer-controls">
          {!isRunning ? (
            <button
              className="btn btn-primary"
              onClick={start}
              disabled={totalDurationSeconds < 1}
            >
              {timeLeft === initialDuration ? 'Start' : 'Resume'}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={pause}>
              Pause
            </button>
          )}
          {hasElapsedTime && (
            <button
              className="btn btn-log"
              onClick={stopAndLog}
              title="Save session with elapsed time and reset"
            >
              Stop &amp; Log
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={reset}
            disabled={isRunning || (timeLeft === initialDuration && !hasElapsedTime)}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="sessions-section">
        <div className="sessions-header">
          <h2>
            Session History
            {user && <span className="sync-badge">Synced</span>}
          </h2>
          <button
            className="btn btn-export"
            onClick={handleExport}
            disabled={sessions.length === 0}
          >
            Export CSV
          </button>
        </div>
        <ul className="session-list">
          {loading ? (
            <li className="empty-state">Loading sessions...</li>
          ) : sessions.length === 0 ? (
            <li className="empty-state">No sessions yet. Start your first meditation above.</li>
          ) : (
            sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onUpdate={handleUpdateSession}
                onDelete={handleDeleteSession}
              />
            ))
          )}
        </ul>
      </section>
    </div>
  )
}

export default App
