# Build Council for macOS

Run these commands on a Mac with Xcode Command Line Tools installed.

```bash
cd "/path/to/council-mobile"
npm ci
npm run desktop:build:macos
```

Output:

```text
src-tauri/target/release/bundle/dmg
```

For professional distribution outside the Mac App Store, sign and notarize the app with an Apple Developer account. Unsigned builds may be blocked or warned by Gatekeeper.
