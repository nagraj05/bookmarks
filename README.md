<p align="center">
  <img src="assets/images/bookmarks-icon-v5.png" width="120" alt="Bookmarks app icon" />
</p>

<h1 align="center">Bookmarks</h1>

<p align="center">
  A colorful, local-first bookmark manager for Android and iOS.
  Save links from any app, organize them into folders, and keep everything on your device.
</p>

<p align="center">
  <img alt="Expo SDK 58" src="https://img.shields.io/badge/Expo%20SDK-58-000000?style=flat-square&logo=expo" />
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.88-61DAFB?style=flat-square&logo=react" />
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-Android%20%7C%20iOS-FF6B9E?style=flat-square" />
  <img alt="Storage" src="https://img.shields.io/badge/storage-local%20SQLite-8BE28B?style=flat-square" />
</p>

## Why Bookmarks?

Bookmarks is designed for people who want a fast place to save links without creating another cloud account. Share a link from another app and it lands directly in your Inbox. Organize it later, search it, favorite it, or move it into a flat folder structure.

## Features

- Save links from the standard Android and iOS share menus
- Store all bookmarks and settings locally with SQLite
- Send new shares directly to Inbox with no interruption
- Prevent duplicate links from being saved
- Organize bookmarks into simple, non-nested folders
- Rename, recolor, and delete folders with a long press
- Move bookmarks between folders from the details screen
- Fetch titles, descriptions, favicons, and preview images
- Filter bookmarks by source app, including X, Instagram, Facebook, YouTube, Reddit, and more
- Search, favorite, archive, restore, trash, and permanently delete bookmarks
- Open links in their associated app with a browser fallback
- Choose System, Light, or Dark appearance
- Use the app completely offline after link metadata has been fetched

## Privacy

Bookmarks has no account system and no cloud database. Bookmark records, folder information, and preferences remain in the app's local SQLite database on your device.

Uninstalling the app removes that local database. Backup and restore are planned but are not included in the first release.

## Getting started

### Requirements

- Node.js 22.13 or newer
- npm
- Android Studio and Android SDK for local Android builds
- An Expo account for EAS builds

### Install and run

```bash
npm install
npx expo start
```

This project uses a development build because sharing and other native capabilities are not limited to Expo Go's bundled native modules.

To build and install locally on a connected Android device:

```bash
npx expo run:android
```

To create an installable preview build with EAS:

```bash
npx eas-cli@latest build --platform android --profile preview
```

## Quality checks

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Technology

- Expo SDK 58 and React Native 0.88
- Expo Router for file-based navigation
- Expo SQLite for persistent on-device storage
- Expo Sharing for native share targets
- Expo Image for cached link previews
- TypeScript

## Project structure

```text
src/
├── app/          # Expo Router screens and layouts
├── components/   # Shared interface components
├── hooks/        # Theme and application hooks
├── lib/          # SQLite, bookmark, and metadata logic
└── providers/    # Application-wide providers
```

## Releases

Every release has a matching Git tag, GitHub release notes, and entry in [CHANGELOG.md](CHANGELOG.md).
