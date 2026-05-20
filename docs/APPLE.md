# Apple Builds

## What is possible before Apple Developer enrollment

There is no general iPhone equivalent of an Android APK that any user can install freely outside the App Store.

Before Apple Developer Program enrollment, the practical paths are:

- iPhone/iPad source-code preview with Expo Go.
- iOS Simulator standalone build through EAS, usable on a Mac simulator.
- macOS desktop build from source on a Mac.

## iPhone/iPad with Expo Go

This is the easiest path for Apple users who need to inspect or edit the app before App Store work starts.

On the development computer:

```powershell
npm.cmd run ios:expo-go
```

Or double-click:

```text
START_COUNCIL_IOS_EXPO_GO.cmd
```

On iPhone/iPad:

1. Install Expo Go from the App Store.
2. Join the same Wi-Fi network as the development computer.
3. Scan the QR code shown by Expo.

This runs the app from source. It is not a signed standalone IPA.

## iOS Simulator Standalone Build

Expo supports simulator builds that do not need TestFlight or an Apple Developer account.

```powershell
npm.cmd run ios:simulator-build
```

On a Mac with an iOS Simulator:

```powershell
npm.cmd run ios:simulator-run
```

## Real iPhone Standalone Install

For real devices, Apple requires signing/provisioning. Practical options:

- TestFlight: requires Apple Developer Program and App Store Connect.
- Ad Hoc/development provisioning: requires Apple Developer Program and registered devices.
- EU/Japan alternative distribution: region-limited and still requires Apple developer processes, signing, and notarization.
- Xcode personal development signing: useful for the developer's own device, not a serious customer distribution method.

## macOS Desktop

Council uses Tauri for macOS desktop packaging.

On a Mac:

```bash
npm ci
npm run desktop:build:macos
```

Output:

```text
src-tauri/target/release/bundle/dmg
```

For professional distribution outside the Mac App Store, use Developer ID signing and Apple notarization after Apple Developer enrollment.

## Production Recommendation

Until Apple Developer enrollment is ready:

1. Use Expo Go for iPhone/iPad source previews.
2. Use iOS simulator builds for standalone QA on Mac.
3. Use Tauri `.dmg` for macOS internal testing.
4. After enrollment, add TestFlight/App Store submission and production StoreKit product IDs.
