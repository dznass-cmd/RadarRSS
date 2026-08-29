# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] (Beta) - 2026-08-29

### Added
- **Native High-Definition Icons:** Generated crisp raster PNG icons across all density buckets (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`, and `512px` store asset) featuring the official **Global Signal Matrix** design.
- **APK and Installer Icon Display:** Ensured custom branding appears seamlessly in Windows installers, desktop shortcuts, `.apk` file explorers, and the Android package installer modal.
- **Official Release Signing:** Configured production cryptographic keystores with v2 and v3 signature schemes to eliminate Play Protect sideloading warnings.
- **Mobile Enhancements:** Added pull-to-refresh gestures with haptic feedback, horizontally scrolling category navigation, and responsive drawer navigation.

---

## [0.0.1] (Beta) - 2026-08-29

### Added
- Initial public beta release for **Windows Desktop** and **Android (Native APK)**.
- Capacitor integration with universal network adapters for direct client-side RSS feed parsing.
- New `SafeImage` component with loading indicators, graceful fallback placeholders, and relative URL resolvers.
- Visual Beta badge (`v0.0.1`) displayed across settings and header navigation.

### Fixed / Improved
- Enhanced RSS media extraction: expanded support for `media:content`, `media:thumbnail`, `enclosure`, and embedded HTML `<img>` tags.
- Automatic normalization of protocol-relative (`//`) and relative URLs.
- Filtered out 1x1 tracking beacons and analytics pixels.

---

## [2.0.4] - 2026-08-16

### Added
- Official Windows desktop release with background auto-updates powered by GitHub Releases.

---

## [2.0.2] - 2026-08-11

### Added
- Windows builds configured with `electron-builder`: `RSS Radar-2.0.1-portable-x64.exe` and `RSS Radar-2.0.1-setup-x64.exe`.
- Added `build:win` script and build configuration (NSIS + portable) in `package.json`.
- Configured `electron` as a devDependency and added `desktop` dev script.

### Fixed
- Fixed `process.chdir(__dirname)` failure inside `app.asar` (ENOENT) by restricting directory switching to development environments.
- Corrected `distPath` resolution in packaged bundles to properly locate application assets.

---

## [2.0.1] - 2026-08-02

### Added
- Integrated Google Gemini AI for automated bullet-point executive summaries and news curation.
- Support for customizable dynamic blocks and multi-category RSS feeds.
- Electron packaging support for Windows.

---

## [2.0.0] - 2026-08-02

### Added
- Brand-new modern UI built with React 19, Vite, and Tailwind CSS.
- Local Express backend for real-time async RSS parsing and caching.
- Dynamic block customization and custom accent color themes.

---

## [1.0.0] - 2026-07-30

### Added
- Initial release of Radar RSS aggregator.
- Real-time news monitoring across major international and regional portals.

---

## [Legend]

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.
