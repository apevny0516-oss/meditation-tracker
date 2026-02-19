const SESSIONS_KEY = 'meditation-sessions';
const TIMER_SETTINGS_KEY = 'meditation-timer-settings';

export function getSessions() {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function addSession(session) {
  const sessions = getSessions();
  sessions.unshift({
    id: crypto.randomUUID(),
    ...session,
  });
  saveSessions(sessions);
  return sessions;
}

export function updateSession(id, updates) {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return sessions;
  sessions[idx] = { ...sessions[idx], ...updates };
  saveSessions(sessions);
  return sessions;
}

export function deleteSession(id) {
  const sessions = getSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
  return sessions;
}

export function getTimerSettings() {
  try {
    const data = localStorage.getItem(TIMER_SETTINGS_KEY);
    if (!data) return null;
    const { minutes, seconds } = JSON.parse(data);
    if (typeof minutes === 'number' && typeof seconds === 'number') {
      return { minutes: Math.max(0, Math.min(999, minutes)), seconds: Math.max(0, Math.min(59, seconds)) };
    }
  } catch {}
  return null;
}

export function saveTimerSettings(minutes, seconds) {
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify({ minutes, seconds }));
}
