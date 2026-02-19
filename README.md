# Meditation Timer

A calming meditation timer app that logs sessions, tracks streaks, and exports data to CSV.

## Features

- **Timer** — Set any duration (minutes + seconds). Start, pause, and reset.
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

- **Local** — Sessions are stored in your browser's `localStorage` by default.
- **Firebase (optional)** — Sign in with Google to sync sessions across devices using Firestore.

### Firebase Setup (optional)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → **Sign-in method** → **Google**
3. Create a **Firestore Database**
4. Copy `.env.example` to `.env` and add your Firebase config (Project Settings → Your apps)
5. Deploy Firestore rules: `firebase deploy --only firestore` (requires [Firebase CLI](https://firebase.google.com/docs/cli))

### Firebase on GitHub Pages

For Google sign-in to work on the deployed site, add your Firebase config as repository secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets (values from your `.env` or Firebase Console):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Add `https://apevny0516-oss.github.io` to Firebase **Authentication** → **Settings** → **Authorized domains**
