/**
 * Get unique dates from sessions (YYYY-MM-DD format for comparison)
 */
function getUniqueDates(sessions) {
  const dates = new Set();
  for (const session of sessions) {
    const date = session.completedAt.split('T')[0];
    dates.add(date);
  }
  return [...dates].sort().reverse();
}

/**
 * Check if two dates are consecutive days
 */
function areConsecutiveDays(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate current streak (consecutive days including today if meditated today)
 */
export function calculateCurrentStreak(sessions) {
  const uniqueDates = getUniqueDates(sessions);
  if (uniqueDates.length === 0) return 0;

  const today = getTodayStr();
  const mostRecentDate = uniqueDates[0];

  // Streak only counts if user meditated today or yesterday (active streak)
  const daysSinceLastSession = Math.ceil(
    (new Date(today) - new Date(mostRecentDate)) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastSession > 1) return 0; // Streak broken

  let streak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      streak = 1;
    } else if (areConsecutiveDays(uniqueDates[i - 1], uniqueDates[i])) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calculate longest streak ever
 */
export function calculateLongestStreak(sessions) {
  const uniqueDates = getUniqueDates(sessions);
  if (uniqueDates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    if (areConsecutiveDays(uniqueDates[i - 1], uniqueDates[i])) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
