## CCSA Mobile (React Native / Expo)

Short description

This repository contains the mobile client for the CCSA application, built with Expo (React Native). The app is designed for field agents to register, manage farm data, view maps, scan/generate QR codes, print/share documents and interact with the backend services.

Key features

- Farmer and agent registration flows (forms, NIN input validation)
- Interactive maps and polygon support (multiple map components and wrappers)
- QR code generation and scanning support for certificates and records
- Capture photos and documents using the device camera
- Print and share documents (PDFs / certificates) via expo-print and sharing
- Offline-friendly storage via AsyncStorage for basic caching
- Integration with Supabase, Firebase and other backend services
- Forms and validation using react-hook-form and zod
- State management with Zustand and lightweight hooks

Project structure (high level)

- `App.js` / `index.js` — app entry points
- `src/components/` — reusable UI components
- `src/screens/` — app screens (registration, dashboard, forms)
- `src/hooks/` — custom hooks (map handling, permissions, etc.)
- `src/services/` — API wrappers and integrations (Supabase, Firebase, etc.)
- `src/store/` — Zustand stores for client state
- `assets/` — images and fonts
- `android/`, `ios/` — native configuration and build files
- `scripts/` — helper scripts (build helpers, optimize scripts)

Key technologies

- Expo / React Native (SDK 54+)
- EAS (Expo Application Services) for builds
- Supabase & Firebase integrations
- React Navigation (stack/drawer/tabs)
- react-native-maps, Google maps components
- nativewind (Tailwind for RN) for utility-first styling
- react-hook-form + zod for typed validation
- Zustand for state management

Installation and quick start

Prerequisites

- Node.js (LTS recommended)
- Yarn or npm
- Expo CLI (optional, project uses `expo` in package.json)
- For device builds: Android Studio or Xcode (for iOS), Java SDK, Android SDK

Install dependencies

```bash
# from repository root or inside ccsa-mobile folder
npm install
# or
yarn install
```

Running in development (Expo)

```bash
# start Metro / Expo
npm run start

# to run on Android device/emulator
npm run android

# to run on iOS simulator (macOS + Xcode required)
npm run ios

# to run on web
npm run web
```

Production builds (EAS)

- The project contains EAS build scripts in `package.json` and `eas.json` if present.
- Example commands:

```bash
# build android (managed or bare as configured)
npm run build:android

# build android production profile
npm run build:android:prod

# build ios
npm run build:ios

# submit builds
npm run submit:android
npm run submit:ios
```

Helpful local scripts

- `npm run optimize` — runs `scripts/optimize-production.sh` to shrink assets for production
- `npm run postbuild` — post build notification script

Environment variables and secrets

The app integrates with external services; you'll typically need the following environment variables or config entries (check `app.config.js`, `eas.json` and `src/config` for exact keys used in your copy):

- SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY
- FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
- API_BASE_URL (if pointing to the admin/backend API rather than embedding service SDKs)
- SENTRY_DSN or other crash-reporting keys (if used)

Check `app.config.js` and any env files used by the team for precise variable names.

Debugging and troubleshooting

- If Metro fails to bundle: clear caches `expo start -c` or `npx react-native start --reset-cache`.
- Android emulator issues: ensure `adb` is visible in PATH and emulator is running.
- iOS errors: ensure Xcode command line tools and proper provisioning profiles are configured.
- EAS build failures: inspect logs from EAS and verify credentials (keystore, provisioning profiles) are configured in `eas.json` and the EAS dashboard.

Notes and tips

- The project uses TypeScript types in parts of the code; ensure your editor is set up for TS to get type hints.
- Many UI helpers and pages reference `src/services` endpoints — configure local backend or mock endpoints for fast development.
- When contributing, follow existing UI conventions and tailwind classes (nativewind).

Further reading

- See `BUILD_STATUS.md`, `BUILD_NO_INTERNET.md` and other docs in the repo root for common build/troubleshooting notes.

--
README generated to document the mobile client features and run instructions.
