# Desktop Builds

Council uses Tauri for lightweight desktop packaging.

## Windows

Prerequisites:

- Rust toolchain
- Microsoft C++ Build Tools with Desktop development with C++
- Microsoft Edge WebView2 Runtime

Build:

```powershell
npm.cmd run desktop:build:windows
```

Installer output:

```text
src-tauri/target/release/bundle/nsis
```

A convenience copy is also placed at:

```text
desktop-installers/windows/Council_1.0.0_x64-setup.exe
```

## Linux

Linux builds should be produced on Linux or CI. Building Linux packages from Windows is not the practical path for Tauri.

Build on Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
npm ci
npm run desktop:build:linux
```

Outputs are under:

```text
src-tauri/target/release/bundle
```

## macOS

macOS builds should be produced on macOS or CI.

Build on macOS:

```bash
npm ci
npm run desktop:build:macos
```

Output:

```text
src-tauri/target/release/bundle/dmg
```

For external distribution, sign and notarize with Apple Developer Program credentials. Unsigned builds are fine for source-code inspection/internal development, but not a polished public distribution.

## AI Backend

Desktop builds do not embed API keys. For local AI testing, run:

```powershell
npm.cmd run api
```

For production, point the app to a deployed HTTPS backend at build time with:

```powershell
$env:EXPO_PUBLIC_COUNCIL_API_URL="https://your-api.example.com"
npm.cmd run desktop:build:windows
```
