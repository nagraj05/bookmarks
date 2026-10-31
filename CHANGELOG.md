# Changelog

All notable changes to Bookmarks are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-10-31

### Added

- Folder icons with a larger expandable icon picker for new and existing folders
- In-app Android update checks with direct GitHub Release APK downloads and a 24-hour Later option

### Changed

- Replaced the inline new-folder form with a bottom sheet ordered by name, color, and icon
- Refined folder cards around icon-first layouts without bookmark counts
- Simplified the New Link screen close button, quick tip, and save action

## [1.3.1] - 2026-10-30

### Fixed

- Prevented incoming shares from becoming stuck on the native logo screen during cold starts
- Added a safe retry screen when app-lock settings cannot be read from the local database

## [1.3.0] - 2026-10-29

### Added

- Tumblr source detection and social-card support
- Long-press multi-select in folders with Select All, multi-folder Move and Copy, and bulk delete-to-Trash actions
- Optional smart app folders with official source icons and automatic bookmark grouping
- Spotify link detection, migration, card branding, and smart-folder support
- Two-column app-folder grids with long-press Select All and bulk delete-to-Trash

### Changed

- Social cards now show post text or captions instead of usernames and domains
- Branded app cards no longer show raw source domains such as `open.spotify.com`
- Instagram, X, Substack, Tumblr, LinkedIn, and Threads cards now use bundled brand icons
- Emoji entities in social captions now render as native emoji
- Replaced the large multi-block loader with a compact neo-brutalist loading card
- Simplified the incoming-share progress message to “Saving…”
- Limited the default Recently Saved section to the four newest bookmarks
- Removed loader flashes from navigation reads and delayed overlays for fast background work
- Added a short Reanimated neo-brutalist launch sequence before the Library appears

### Fixed

- Android release automation now extracts changelog notes reliably on Linux runners
- Shared links now finish saving their preview metadata before Android returns to the source app
- Reopening Bookmarks after sharing now lands on the Library instead of a stale share confirmation screen

## [1.2.0] - 2026-10-29

### Added

- Interactive horizontal paging between Library, Folders, and Settings
- Live adjacent-screen previews that follow the finger during partial swipes
- Background folder preloading so the Folders preview is populated before navigation settles

### Changed

- Preserved the existing bottom navigation design while adding swipe and tap navigation

### Fixed

- GitHub releases now publish version-specific notes from this changelog instead of an empty compare-only entry

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

[Unreleased]: https://github.com/nagraj05/bookmarks/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/nagraj05/bookmarks/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/nagraj05/bookmarks/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/nagraj05/bookmarks/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/nagraj05/bookmarks/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/nagraj05/bookmarks/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nagraj05/bookmarks/releases/tag/v1.0.0
