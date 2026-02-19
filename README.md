# Meditation Timer

A calming meditation timer app that logs sessions, tracks streaks, and exports data to CSV.

## Features

- **Timer** — Set 5, 10, 15, 20, or 30 minute sessions. Start, pause, and reset.
- **Session logging** — Every completed session is saved with date, time, and duration.
- **Streak tracking** — Current streak (consecutive days) and longest streak ever.
- **CSV export** — Download all sessions as a CSV file for backup or analysis.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

The built app will be in the `dist` folder, ready to deploy or run locally.

## Data Storage

Sessions are stored in your browser's `localStorage`, so they persist between visits. Export to CSV to back up your data or move it elsewhere.
