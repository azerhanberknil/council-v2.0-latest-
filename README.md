# Council Mobile

Native-first Expo app for structured multi-lens decision support.

## What is included

- Expo Router mobile app
- Sign in / register / guest entry shell
- Guest mode with one-off sessions and no saved history
- Member mode with local saved decision history
- Light and dark themes
- English, Turkish, Russian and German UI language options
- Safe original archetypes, not real-person simulations
- Backend proxy for Gemini so API keys are not shipped in the app bundle
- Local fallback decision engine when the backend is unavailable

## Secret handling

Do not put Gemini or other AI provider keys in Expo env vars or client code. Mobile bundles can be inspected.

Create this file locally:

```text
server/.env.local
```

Use this shape:

```text
GEMINI_API_KEY=your_rotated_key_here
GEMINI_MODEL=gemini-2.5-flash
COUNCIL_API_PORT=8787
```

The key that was pasted into chat should be rotated in Google AI Studio / Google Cloud before production use.

## Run locally

Terminal 1:

```powershell
cd "C:\Users\antiq\OneDrive\Belgeler\New project\council-mobile"
npm.cmd run api
```

Terminal 2:

```powershell
cd "C:\Users\antiq\OneDrive\Belgeler\New project\council-mobile"
npm.cmd run android
```

Android emulator uses `http://10.0.2.2:8787` automatically when `EXPO_PUBLIC_COUNCIL_API_URL` is not set.

For web:

```powershell
npm.cmd run web
```

For the production-style web build, do not open `dist/index.html` directly. Expo exports use app asset paths that must be served over HTTP.

Use the Windows launcher:

```powershell
.\START_COUNCIL_WEB.cmd
```

Then open:

```text
http://localhost:8787
```

The same Node server serves both the web build and `/api/council`.

## Membership and payments

The current app includes the membership UI and account-mode shell, but purchases are intentionally disabled. StoreKit / Google Play Billing should be connected only after App Store Connect enrollment and product IDs exist.

Recommended production path:

- RevenueCat or your own StoreKit 2 receipt validation backend
- Server-side entitlement checks
- No external payment links for digital content inside the iOS app
- Restore purchases button wired to the purchase SDK after product IDs exist

## Build targets

Expo supports Android, iOS and web directly. Desktop packaging is handled with Tauri.

Windows installer output:

```text
desktop-installers/windows/Council_1.0.0_x64-setup.exe
```

Linux packages are produced on Linux or through the included GitHub Actions workflow:

```text
.github/workflows/desktop-build.yml
```

Apple pre-enrollment options:

- iPhone/iPad source preview: `START_COUNCIL_IOS_EXPO_GO.cmd`
- iOS simulator build on Mac: `npm.cmd run ios:simulator-build`
- macOS desktop build on Mac/CI: `npm run desktop:build:macos`

See `docs/BUILD.md`, `docs/DESKTOP.md`, and `docs/APPLE.md`.
