export function exportSessionsToCSV(sessions) {
  const headers = ['Date', 'Time', 'Duration (minutes)', 'Duration (seconds)'];
  const rows = sessions.map((s) => {
    const d = new Date(s.completedAt);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString();
    const minutes = Math.floor(s.durationSeconds / 60);
    const seconds = s.durationSeconds % 60;
    return [date, time, minutes, seconds].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meditation-sessions-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
