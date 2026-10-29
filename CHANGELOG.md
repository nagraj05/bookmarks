# Changelog

All notable changes to Bookmarks are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-29

### Added

- Automated Android APK builds and GitHub releases for pushed `v*` tags
- Optional app lock using biometric or device authentication
- App-wide neobrutalist loading feedback for database operations and link metadata fetching
- Substack source detection and filtering
- One-tap description copying from bookmark details

### Changed

- Replaced the system permanent-delete alert with a centered neobrutalist confirmation modal
- App Lock now activates only after Android turns the screen off, not during ordinary app switching
- Android shares now save directly to Inbox and return to the source app instead of opening bookmark details
- Replaced Archive and Move to Trash text actions with accessible icons

### Fixed

- Detail and folder back buttons now return safely to Library when no navigation history exists
- Threads links using the current `threads.com` domain are classified correctly
- Dark buttons, source filters, and folder badges now choose readable contrasting text automatically

## [1.0.0] - 2026-10-29

### Added

- Local-first bookmark storage powered by SQLite
- Android and iOS share targets that save incoming links directly to Inbox
- Automatic duplicate-link prevention
- Link metadata, favicon, description, and image-preview fetching
- Flat folder organization with create, rename, recolor, and delete actions
- Safe folder deletion that moves contained bookmarks back to Inbox
- Two-column bookmark grids in the Library and folder details
- Search and filters for Favorites, Archive, Trash, and source apps
- Bookmark favorites, archive, restore, trash, and permanent deletion
- Link opening through associated apps with a browser fallback
- Persistent System, Light, and Dark appearance settings
- Bold neobrutalist interface with responsive light and dark palettes
- Android, iOS, and web app-icon configuration

[Unreleased]: https://github.com/nagraj05/bookmarks/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/nagraj05/bookmarks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nagraj05/bookmarks/releases/tag/v1.0.0
