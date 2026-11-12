# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-11

### 🚀 Highlights & Major Features
- **📖 Full Article Reader View (Modo Leitura Completa):**
  - Distraction-free article reader powered by **Mozilla Readability** and **DOMPurify** sanitization, scraping destination news pages on demand without paywall banners, ads, cookie popups, or tracking scripts.
  - Dynamic scroll progress bar tracking reading completion in real-time.
  - Reading metadata badge showing estimated reading time (e.g. `⏱️ 3 min de leitura`) and word count.
  - Seamless one-click toggling between Full Article View and RSS Feed Summary.
  - Deep synergy with Web Speech Text-to-Speech (TTS) and Google Gemini AI Executive Summarization to analyze the entire article body.
- **📥 Universal OPML 2.0 Feed Import & Export:**
  - Full compatibility with the universal RSS subscription standard (`.opml` / `.xml`), enabling seamless migration to and from **Feedly**, **Inoreader**, **NetNewsWire**, **Pocket**, and **Google Reader** archives.
  - **Hierarchical Category Folders:** Automatically groups feeds into topic folders (`Technology`, `Brazil News`, `Finance & Markets`, `Sports`, `Entertainment & Gaming`, etc.) on export and reconstructs them during import.
  - **Defensive Dual-Engine Parser:** Browser-native high-speed parsing via `DOMParser` paired with a zero-dependency regex fallback for Node.js / test environments.
  - **Smart Category Normalization:** Semantic keyword matching (`normalizeCategory`) to accurately categorize imported feeds into Radar RSS Bento buckets.
  - **In-App Hub & Immediate Feedback:** 4-action action bar in `ManageFeedsModal` distinguishing universal OPML from full JSON backups, with deduplication counts and real-time toast alerts.
- **🦀 Ultra-Lightweight Rust & Tauri 2.0 Desktop Target:**
  - Added standalone native desktop build using **Rust 1.99** and **Tauri 2.0**, operating in parallel with the Electron desktop app.
  - **51% Less Memory Consumption:** Reduced total resident set size (RSS) from ~1.085 GB (Electron) to **~533 MB** under identical workloads (17 active feeds, 520+ live stories).
  - **Tiny Native Binary:** Stripped Release executable is only **6.8 MB** (over 90% reduction compared to Electron's 85 MB binary and 260 MB disk footprint).
  - **Instant Startup:** Cold launch time reduced to **< 50ms**.
  - **80% Fewer OS Processes:** Runs with only 2 processes (native Rust runtime + system WebKitGTK / WebView2) vs 10 child processes in Electron.
  - New developer scripts: `npm run desktop:tauri` and `npm run build:tauri`.
- **🎨 Authentic Brand Icon Standardization:**
  - Renamed Tauri binary and crate to `radar-rss` and fixed GNOME Linux desktop integration with dedicated `.desktop` launcher and hicolor theme icon registrations.
  - Synchronized high-resolution concentric radar icon across all platforms (`public/icon.png`, `build/icon.ico`, `src-tauri/icons/`).
- **🧪 Comprehensive Automated Testing & Visual Verification Suite:**
  - Automated unit test suite via `npm test` verifying clustering algorithms and OPML roundtrips with **100% pass rate (29/29 tests)**.
  - Headless Electron visual test script (`scripts/test-visual-opml.cjs`) capturing end-to-end screenshots and verifying UI state transitions.
- **🌐 Network & Localization Improvements:**
  - Permissive CORS middleware in Express server (`server.ts`) for cross-origin local and Electron development.
  - Automatic language detection on first launch via `navigator.language` (defaulting to Brazilian Portuguese for `pt` locales).
  - Unblocked G1 / Globo feeds from feed list filters.
  - Defensive regex JSON extraction for Gemini AI curation.

## [0.1.0] - 2026-09-10

### 🚀 Highlights & Major Features
- **🪟 Full Windows Desktop Experience (Electron Integration):**
  - **System Tray & Background Mode:** Minimize to system tray on close, quick context menu (Refresh Feeds, Auto-start toggle, Minimize toggle, Check for Updates, Quit), and single/double-click restore.
  - **Native Windows Notifications:** Registered `AppUserModelId` (`com.dznasscmd.radarrss`) with Start Menu shortcut linking for rich Action Center alerts with click-to-open article navigation and taskbar alert flashing (`flashFrame`).
  - **Multi-Resolution Windows Icons:** Full `.ico` generation with 7 standard sizes (16, 24, 32, 48, 64, 128, 256 px) sampled from the official Radar RSS design with bicubic filtering, preventing Electron icon fallbacks.
  - **Window State Persistence:** Automatically remembers dimensions, position, and maximized state with multi-monitor disconnect safety fallback.
  - **Desktop Keyboard Shortcuts:** <kbd>F5</kbd>/<kbd>Ctrl+R</kbd> (smooth feed refresh), <kbd>Ctrl+F</kbd> (global search focus), <kbd>Ctrl+,</kbd> (settings), <kbd>Ctrl+B</kbd> (bookmarks), <kbd>Ctrl+N</kbd> (new block), <kbd>Ctrl+D</kbd> (theme toggle), <kbd>Esc</kbd> (close modal/cancel search).
  - **Native Context Menu:** Right-click context menus for text input editing, Google search on selection, and external link handling.
  - **Desktop Settings & Preferences:** Dedicated "Desktop (Windows)" settings card in SettingsModal with full English/Portuguese i18n.
  - **Secure Preload Architecture:** `contextIsolation: true`, `nodeIntegration: false`, and safe bidirectional IPC via `contextBridge`.

## [0.0.9-beta] - 2026-09-06

### 🚀 Highlights & Major Features
- **🧩 Cross-Feed News Deduplication & Story Clustering ("News Cluster"):**
  - High-performance multi-signal similarity engine ($O(N \cdot k)$ via temporal inverted index):
    - Normalized token overlap & n-grams with multilingual stopword removal (PT, EN, ES).
    - Canonical URL normalization (automatic removal of tracking parameters `utm_*`, `ref`, `fbclid`, anchors `#`, and protocol normalization).
    - Named entity and numerical identifier matching (models, percentages, years, currency).
    - Semantic action divergence protection (preventing false clustering between distinct events like *"announces new iPhone"* vs *"raises iPhone prices"*).
    - Exponential temporal decay function ($e^{-\lambda \Delta t}$) respecting the configured correlation window.
    - Short headline guardrail requiring snippet overlap confirmation for titles under 3 tokens.
  - Multi-source UI badge (`3 fontes`) displaying combined news coverage (e.g. `Reuters · The Verge · TechCrunch`).
  - Expandable source drawer in news cards for viewing individual outlet headlines, publication timestamps, and direct external links.
  - Interactive source switching tabs inside the Article Reader modal, seamlessly toggling title, full text, author, and outlet attribution without losing reading state.
  - Synchronized read/unread and bookmark state across all constituent article IDs in a cluster.
- **🧠 Consolidated Multi-Source AI Executive Briefing (Google Gemini):**
  - Updated Gemini executive summarization engine to synthesize facts, quotes, and perspectives across all constituent outlets of a story cluster into a unified bulleted briefing without redundancies or hallucinations.
  - Graceful fallback when AI is disabled or for single-source articles.
- **⚙️ Configurable Deduplication Preferences:**
  - Dedicated settings section with real-time toggle (on/off).
  - Strategy selector: Balanced (0.58), Conservative (0.72, zero false positives), and Aggressive (0.45).
  - Configurable temporal correlation window (12h, 24h, 48h, 72h) and maximum sources per story cluster.
- **⚡ Electron Desktop Architecture & Launch Optimizations:**
  - Disabled ASAR compression (`"asar": false`), enabling Express and Node.js to access and serve static web assets natively from physical disk paths.
  - Eliminated single-instance lock deadlocks and added second-instance window restoration and focus.
  - Graceful `did-fail-load` fallback directly to local `index.html`.

---

## [0.0.8-beta] - 2026-09-06

### 📱 Android & Native Mobile Stability
- **Google Gemini AI Direct API Fix & Key Validation:** Fixed model identifier from non-existent `gemini-2.5-flash`/`gemini-3.6-flash` to official `gemini-2.0-flash` (with fallback to `gemini-1.5-flash`), migrated mobile network calls to native `CapacitorHttp` to eliminate WebView restrictions, and added interactive "Validar Chave" button with instant visual status feedback and direct link to obtain a free API key in Settings.
- **Native Android System Notifications (`@capacitor/local-notifications`):** Integrated native system notifications for Android (status bar & heads-up shade alerts), configuring high-importance notification channel (`radar_rss_news`), Android 13+ `POST_NOTIFICATIONS` runtime permission, deep link to article on tap, and permission status indicators in Settings.
- **Native Android CORS Bypass (`CapacitorHttp`):** Integrated native HTTP request handling via `@capacitor/core` to directly fetch RSS/Atom feeds, eliminating browser CORS blocking on external news feeds without proxy dependence.
- **Resilient Mobile Timeout & User-Agent:** Increased feed connection and read timeout to 10–15s to handle high-latency cellular networks (3G/4G/5G), and configured realistic Android mobile User-Agent.
- **Enhanced Atom & Dublin Core Feed Parser:** Fixed `<link rel="alternate">` retrieval and added support for `<id>` and `<dc:date>` in client-side XML parser.
- **Stable Android Back Button Lifecycle:** Migrated modal state management to `activeModalsRef` to eliminate listener thrashing and memory leaks, adding a 2-second confirmation on root screen to prevent accidental exits.
- **Thread-safe Haptic Feedback:** Wrapped all `Haptics.impact()` calls with `.catch(() => {})` to eliminate unhandled promise rejections on devices without haptic hardware.
- **Edge-to-Edge Safe Area Inset Fix:** Removed conflicting inline `padding: 0` on `<body>` in `index.html` to allow native status bar and gesture navigation safe-area insets (`--sat`, `--sab`) to apply correctly.
- **Dynamic Java 21 Check in Build Script:** Updated `build-apk.sh` to dynamically detect installed Java version, preventing unnecessary downgrades on OpenJDK 21 environments.

---

## [0.0.7] - 2026-09-01

### 🤖 Direct Google Gemini AI Integration (Client-Side & Mobile)
- **Direct Gemini REST API (`gemini-2.5-flash`):** Enabled direct client-side generative AI calls for article summaries, smart dynamic block curation, and language translation without requiring the Node.js backend server.
- **Custom Gemini API Key Configuration:** Added dedicated settings field for users to configure their own Google Gemini API key with local persistent storage.
- **Graceful Client Fallback:** Added smart local editorial digest fallback when running natively on Android without an API key.

### 📱 Mobile & Android Enhancements
- **Native Backup & Restore Sharing:** Integrated `@capacitor/share` to export configuration JSON directly into the Android native share sheet (Drive, WhatsApp, Files, etc.).
- **Smooth Auto-scrolling Breaking Ticker:** Implemented continuous seamless marquee auto-scroll with frame-synchronized animation and hover/touch pause.
- **Modern In-App Toast Feedback:** Replaced browser dialog popups with elegant status toast notifications.
- **Standalone Android Build Script:** Added `build-apk.sh` script to streamline APK compilation directly inside Termux.

---

## [0.0.6-beta] - 2026-08-31

### 🎨 Visual & Theme Fixes
- **Comprehensive Light Theme Polish:** Fixed over 40 visual inconsistencies across all components, resolving invisible text, hardcoded dark palette colors, and missing theme-aware conditionals.
- **Enhanced Component Contrast:** Updated `DynamicBlockCard`, `Navbar`, `SettingsModal`, `ManageFeedsModal`, `GlobalFeedsModal`, `ArticleReaderModal`, `ToastNotificationContainer`, and footer/bookmark cards to support seamless Light and Dark mode switching.
- **Refined Accents & Borders:** Adjusted active states, borders, and badge styling for optimal legibility regardless of chosen theme and accent palette.

### 🤖 CI/CD & Build Pipeline
- **Automated Android APK Workflow:** Added GitHub Actions workflow (`release-android.yml`) to automatically compile debug APKs with Capacitor and Java 17 compatibility patches and attach them to GitHub Releases.

---

## [0.0.5] (Beta) - 2026-08-30

### 🚀 Highlights & Major Improvements
- **⚡ Instant App Startup (< 50ms):** Implemented an offline-first stale-while-revalidate caching engine (`radar_rss_cached_articles_v1`). The app now renders headlines, hero images, and breaking news immediately upon launch, updating seamlessly in the background without blocking the UI.
- **👈👉 Fluid Swipe Story Navigation:** Users can now swipe horizontally (Left-to-Right / Right-to-Left) or click navigation arrows in the Story Reader to effortlessly browse through news articles, complete with smooth slide animations and haptic feedback.
- **🖼️ Universal RSS Image Loading:** Removed CORS preflight restrictions on news CDN images, added an intelligent cached proxy fallback (`weserv`), HTML entity decoding (`&lt;img ...&gt;`), and support for modern lazy-load image attributes (`data-src`, `srcset`, `media:group`). Added thumbnail previews across all modular block layouts.
- **💼 Robust Standalone Portable Executable:** Fixed asset path resolution and single-instance locks in portable `.exe` builds when launched from arbitrary folders (e.g., Downloads, USB drives).
- **🌐 Bilingual Localization (English & Portuguese):** Complete English repository documentation, interface labels, category names, settings dialog, and one-click switching to Portuguese.
- **🔔 Modern In-App Toast System:** Fully eliminated blocking browser `alert()` popups across modals, replacing them with sleek animated status notifications and native push alerts for breaking news.
- **🛡️ Resilient RSS Ingestion:** Added automatic UTF-8 BOM stripping (`\uFEFF`), real browser User-Agent headers, and optimized 4.5s per-feed timeouts to prevent network stalls.
- **🖥️ Instant Electron Desktop Launch:** Accelerated desktop window initialization to under 30ms with instant dark theme `#0a0b0e` frame rendering and zero white flashes.

---

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
