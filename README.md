 <div align="center">
  <img src="assets/images/bookmarks-icon-v5.png" alt="Bookmarks app icon" width="120" />

  # Bookmarks

  **Save links. Organize ideas. Keep everything in one place.**

  [![Android Release](https://img.shields.io/badge/Android-Release-3DDC84?logo=android&logoColor=white)](../../actions)
  ![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
  ![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=white)
  ![Platforms](https://img.shields.io/badge/Platforms-Android%20%7C%20iOS-FF6B9E)
  ![Storage](https://img.shields.io/badge/Storage-Local%20SQLite-8BE28B)

  [Download APK](../../releases/latest) · [Report a bug](../../issues/new)
</div>

## About

Bookmarks is a colorful, local-first bookmark manager for Android and iOS. Save links from apps like Instagram, X, Substack, Pinterest, YouTube, Reddit, and more. Organize everything into folders, find saved links quickly, and keep your collection on your device without creating another cloud account.

## Features

- Save links directly from the native Android and iOS share menus.
- Send shared links straight to your Inbox without interrupting your workflow.
- Store bookmarks, folders, and preferences locally using SQLite.
- Prevent duplicate links from being saved.
- Organize bookmarks into simple, non-nested folders.
- Rename, recolor, and delete folders with a long press.
- Move bookmarks between folders from the details screen.
- Fetch page titles, descriptions, favicons, and preview images.
- Filter bookmarks by source app, including X, Instagram, Facebook, Threads, Substack, YouTube, Reddit, and more.
- Search, favorite, archive, restore, trash, and permanently delete bookmarks.
- Open links in their associated apps, with a browser fallback.
- Optionally lock the app using fingerprint, face, or device authentication.
- Choose a light, dark, or system-matched theme.
- Continue accessing saved bookmarks offline after link metadata has been fetched.

## Privacy

Bookmarks is designed to keep your personal collection on your device.

- No account or sign-in is required.
- No cloud database is used for storing bookmark records.
- Bookmark records, folders, and preferences are stored in the app's local SQLite database.
- Link metadata is fetched when needed to provide previews.
- Uninstalling the app removes its locally stored database.
- Backup and restore are planned but are not included in the first release.

**Note:** Fetching link metadata requires network access. Offline access to previously saved content does not guarantee that external websites or linked media will remain available offline.

> Bookmarks is an independent application and is not affiliated with, endorsed by, or connected to Instagram, Meta, X, Substack, Pinterest, or any other third-party platform.

## Install the app

1. Open the [latest GitHub release](../../releases/latest).
2. Download the `Bookmarks-*.apk` file attached to the release.
3. Open the downloaded APK on your Android device.
4. If Android asks, allow installation from the browser or file manager you used.
5. Open Bookmarks and start saving links from your favorite apps.

The Android release requires a compatible Android device. Check the release notes for the minimum supported Android version.

## Tech stack

| Area | Technology |
| --- | --- |
| Language | TypeScript |
| UI | React Native |
| Framework | Expo SDK 58 |
| Navigation | Expo Router |
| Local storage | Expo SQLite |
| Link sharing | Expo native sharing and platform integrations |
| Images | Expo Image |
| Authentication lock | Device authentication and biometrics |
| Build | EAS Build |
| Releases | GitHub Actions and GitHub Releases |

The repository targets Android and iOS. Native capabilities and release builds depend on the platform-specific configuration and available development environment.

## Build locally

### Requirements

- Node.js 22.13 or newer
- npm
- Android Studio with the Android SDK installed for Android development
- An Android device or emulator
- An Expo account for EAS cloud builds

### Clone the repository

```bash
git clone https://github.com/nagraj05/bookmarks.git
cd bookmarks
```

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npx expo start
```

This project uses a development build because link sharing and other native capabilities require native modules beyond those bundled with Expo Go.

### Build and run on Android

Connect an Android device with USB debugging enabled, or start an emulator, then run:

```bash
npx expo run:android
```

### Create an installable preview APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

The EAS build profile must be configured to produce an APK if you want to install the output directly on an Android device.

## Quality checks

Run the following checks before submitting changes or publishing a release:

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Create a release

Bookmarks uses Git tags to trigger the automated Android release workflow.

Every release should have a matching Git tag, GitHub release notes, and an entry in [CHANGELOG.md](CHANGELOG.md).

### One-time repository setup

1. Create an Expo access token at [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
2. Open the repository's **Settings → Secrets and variables → Actions**.
3. Add a repository secret named `EXPO_TOKEN`.
4. Ensure the EAS project and Android build profile are configured correctly.

Never commit access tokens, signing credentials, or other secrets to the repository.

### Publish a release

Update `CHANGELOG.md` and the app version, commit the changes, and push them to `main`. Then create and push a version tag:

```bash
git add CHANGELOG.md
git commit -m "Prepare v1.0.1 release"
git push origin main

git tag -a v1.0.1 -m "Bookmarks v1.0.1"
git push origin v1.0.1
```

Tags beginning with `v` trigger the Android release workflow.

GitHub Actions runs the configured quality checks, builds an installable APK through EAS, creates a GitHub Release with generated notes, and attaches the APK. The release is published only after the required checks and build succeed.

EAS increments the Android `versionCode` for each release build so that newer APKs can update existing installations, provided the application ID and signing configuration remain compatible.

## Project structure

```text
src/
├── app/          # Expo Router screens and layouts
├── components/   # Shared interface components
├── hooks/        # Theme and application hooks
├── lib/          # SQLite, bookmark, and metadata logic
└── providers/    # Application-wide providers

assets/
└── images/       # App icons and image assets

.github/
└── workflows/    # Automated Android release workflow
```

## Roadmap

- Improve bookmark organization, search, and filtering.
- Add import and export for local bookmark backups.
- Improve link metadata fetching and preview reliability.
- Continue polishing accessibility and the overall user experience.
- Expand and validate the iOS implementation.
- Explore optional cloud synchronization while keeping local storage a first-class option.

---

<div align="center">
  Made with React Native, Expo, and TypeScript.
</div>
