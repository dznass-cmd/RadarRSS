# 📡 Radar RSS

<div align="center">

[![Release](https://img.shields.io/github/v/release/dznass-cmd/RadarRSS?color=orange&label=Release&style=flat-square)](https://github.com/dznass-cmd/RadarRSS/releases)
[![License](https://img.shields.io/github/license/dznass-cmd/RadarRSS?color=blue&style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org)
[![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white&style=flat-square)](https://www.electronjs.org)
[![Android](https://img.shields.io/badge/Android-APK%20Native-3DDC84?logo=android&logoColor=white&style=flat-square)](https://github.com/dznass-cmd/RadarRSS/releases)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-8E75B2?logo=google&logoColor=white&style=flat-square)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white&style=flat-square)](https://tailwindcss.com)

<br />

**Real-time intelligent dynamic RSS news aggregator with Google Gemini AI curation, Windows desktop application, and native Android app support.**

**English** • [Português (Brasil)](README.pt-BR.md)

<br />

[📥 Download App](#-download--installation-windows--android) • [✨ Key Features](#-key-features) • [🚀 Getting Started](#-getting-started-locally) • [🤖 AI Configuration](#-ai-configuration-google-gemini) • [🔄 Auto-Updates](#-automatic-updates)

<br /><br />

<p align="center">
  <img src="images/dashboard_preview.jpg" alt="Radar RSS Dashboard Preview" width="100%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

</div>

---

## 📖 About the Project

**Radar RSS** monitors multiple news portals and RSS feeds in real time, automatically organizing articles into modular, customizable category blocks (such as *Headlines*, *Technology*, *Finance & Business*, *World News*, *Gaming & Entertainment*, and custom topics).

Powered by **Google Gemini Artificial Intelligence**, Radar RSS synthesizes executive bullet-point summaries, extracts key takeaways, evaluates urgency for instant breaking news alerts, and translates foreign feeds on the fly — eliminating clutter and saving you hours of reading time.

---

## ✨ Key Features

- ⚡ **Real-Time Feed Aggregation:** High-throughput async ingestion of national and international RSS/Atom feeds with continuous background updates.
- 🧩 **Cross-Feed Story Clustering & Deduplication:**
  - Automatically identifies and consolidates identical news events reported across multiple outlets (e.g. Reuters, The Verge, TechCrunch) into a unified story cluster.
  - Multi-signal similarity engine: token overlap, n-grams, named entity/number matching, action divergence protection (preventing false merges like "announces new iPhone" vs "raises iPhone price"), temporal decay, and canonical URL normalization.
  - Multi-source UI badge ("3 fontes"), expandable coverage drawer, and interactive source switcher inside the reader.
  - Consolidated multi-source AI executive briefings synthesizing all reporting viewpoints into a unified briefing without duplicates.
  - User-configurable clustering strategies (Balanced, Conservative, Aggressive) and time windows in Settings.
- 🧠 **Smart AI Curation (Google Gemini):**
  - Instant executive bullet summaries per topic or article.
  - Contextual urgency evaluation with automatic **Breaking News** badges and sound alerts.
  - Multi-language translation and synthesis for global articles.
- 🖼️ **Smart Image Extraction (`SafeImage`):** Robust parsing for `media:content`, `media:thumbnail`, `enclosure`, and embedded HTML `<img>` elements with relative URL normalization, tracker pixel filtering (1x1 blocking), and graceful visual fallback placeholders.
- 🖥️ **Windows Desktop App:** High-performance native Electron window with titlebar integration, keyboard shortcuts, and background tray support.
- 📱 **Native Android Mobile App:** Seamless touch experience built with Capacitor, featuring pull-to-refresh gestures, haptic feedback, theme synchronization, and Text-to-Speech (TTS).
- 🔄 **Seamless Auto-Updates:** Built-in background update engine powered by official GitHub Releases.
- 🎨 **Modern & Adaptive UI:**
  - Dark and Light mode themes with custom accent color palettes (Amber, Emerald, Cyan, Violet, Pink, etc.).
  - Flexible block layouts: Hero Highlights, Responsive Grid, Compact Cards, and Editorial Lists.
  - Distraction-free **Focus Reader Mode** with adjustable typography and font scaling.

<br />

<p align="center">
  <img src="images/article_reader_preview.jpg" alt="Radar RSS Article Reader with AI" width="90%" style="border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

---

## 📥 Download & Installation (Windows & Android)

You can download pre-compiled releases directly from the [GitHub Releases](https://github.com/dznass-cmd/RadarRSS/releases) page:

| Platform | Version | Description | Download Link |
|---|---|---|:---:|
| 🪟 Windows | 💿 **Official Installer** | Recommended. Installs shortcuts and **receives silent auto-updates** | [Download Setup (.exe)](https://github.com/dznass-cmd/RadarRSS/releases/latest) |
| 🪟 Windows | 💼 **Portable Edition** | Standalone single executable. Runs instantly without installation | [Download Portable (.exe)](https://github.com/dznass-cmd/RadarRSS/releases/latest) |
| 📱 Android | 📦 **Native APK** | Signed native mobile app for Android smartphones and tablets | [Download APK (.apk)](https://github.com/dznass-cmd/RadarRSS/releases/latest) |

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org) (v18.0.0 or higher)
* `npm` or equivalent package manager
* [Android Studio](https://developer.android.com/studio) / Android SDK (Optional, only needed if compiling the Android APK locally)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dznass-cmd/RadarRSS.git
   cd RadarRSS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Google Gemini API Key (Optional for AI features):**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Launch in Electron desktop mode:**
   ```bash
   npm run desktop
   ```

6. **Build and synchronize with Android (Capacitor):**
   ```bash
   npm run build:android
   npm run open:android
   ```

---

## 🤖 AI Configuration (Google Gemini)

Radar RSS uses the modern official `@google/genai` SDK:

1. Grab a free API key at [Google AI Studio](https://aistudio.google.com/).
2. **Development:** Add `GEMINI_API_KEY=your_key` to `.env.local`.
3. **Production / Desktop:** Place a `.env` file containing `GEMINI_API_KEY=your_key` in the same directory as `Radar RSS.exe`.

> *Note:* If no API key is configured, all core RSS reading, live updating, custom feed management, and filtering features continue to work normally, with AI summary badges gracefully disabled.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vitejs.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| **Local Server** | [Node.js](https://nodejs.org), [Express](https://expressjs.com), [rss-parser](https://www.npmjs.com/package/rss-parser) |
| **Artificial Intelligence** | [Google Gemini API](https://ai.google.dev) (`@google/genai`) |
| **Mobile App** | [Capacitor](https://capacitorjs.com) (Native Android runtime) |
| **Desktop Packaging** | [Electron](https://www.electronjs.org), [electron-builder](https://www.electron.build) |
| **Auto-Updater & CI/CD** | [electron-updater](https://www.electron.build/auto-update), [GitHub Actions](https://github.com/features/actions) |
| **Icons & Micro-interactions** | [Lucide React](https://lucide.dev), [Motion](https://motion.dev) |

---

## 📦 Available Scripts

* `npm run dev` — Starts the Express backend paired with Vite hot-module replacement.
* `npm run build` — Compiles the React web application and bundles the server into `dist/`.
* `npm run desktop` — Launches the application in an Electron desktop shell.
* `npm run build:win` — Compiles Windows executables (NSIS installer + portable `.exe`) inside `release/`.
* `npm run build:android` — Compiles web assets and synchronizes the native Android project.
* `npm run publish:win` — Packages and publishes a release asset directly to GitHub.
* `npm run lint` — Performs static type checking via TypeScript (`tsc --noEmit`).

---

## 🔄 Automatic Updates

The Windows desktop installer features background update verification via GitHub Releases:

1. When launched, the application checks the GitHub Releases API for newer semantic version tags.
2. If an update is detected, the installer downloads quietly in the background.
3. Once ready, an update banner offers a single-click restart to apply the latest build.

To publish a new version, simply increment `version` in `package.json` and push a `vX.Y.Z` tag — **GitHub Actions** will automatically compile and publish the Windows binaries.

---

## 📄 License

This project is open-source and released under the [MIT License](LICENSE).
