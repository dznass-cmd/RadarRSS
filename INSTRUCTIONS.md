# Radar RSS — Development & Release Manual

Comprehensive guide for local development, building Windows executables, compiling the Android APK, and publishing updates via GitHub Releases.

---

## 1. Project Overview

Real-time dynamic RSS news reader featuring customizable modular blocks, international and regional feeds, AI-powered summaries (Google Gemini), and instant breaking news alerts.

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express (embedded local server) |
| Artificial Intelligence | Google Gemini (`@google/genai`) |
| Desktop | Electron (native window) + electron-builder |
| Mobile | Capacitor (Android Native Runtime) |
| Updates | electron-updater via GitHub Releases |

### Folder Structure

```
RadarRSS/
├── android/                 ← Native Android Capacitor project
├── electron/main.cjs        ← Desktop window & auto-updater logic
├── scripts/
│   ├── build-server.mjs     ← Packages server for production bundle
│   ├── generate-android-icons.mjs ← Rasterizes mipmap Android icons
│   └── make-icon.js         ← Generates Windows icon (build/icon.ico)
├── src/                     ← React client source code
├── server.ts                ← Express backend (RSS parsing + Gemini API)
├── package.json             ← Project dependencies, scripts, & build config
├── INSTRUCTIONS.md          ← This development guide
├── release/                 ← Built Windows executables
└── build/icon.ico           ← Windows application icon
```

---

## 2. Local Environment & File Locations

| Item | Location |
|---|---|
| Source Code | Project root directory |
| Windows Installer | `release\Radar RSS Setup X.Y.Z.exe` |
| Windows Portable | `release\Radar RSS X.Y.Z.exe` |
| Unpacked Windows Binary | `release\win-unpacked\Radar RSS.exe` |
| Android Debug APK | `android\app\build\outputs\apk\debug\app-debug.apk` |
| Gemini API Key | `.env.local` (development) / `.env` next to `.exe` (production) |

---

## 3. Running Locally in Development

**Prerequisite:** Node.js (version 18 or higher).

```bash
npm install          # First time or after updating dependencies
npm run dev          # Starts local web app at http://localhost:3000
```

Additional commands:

```bash
npm run desktop      # Launches inside an Electron window without packaging
npm run lint         # Validates TypeScript types (tsc --noEmit)
npm run build        # Compiles production dist/ folder (client + server)
```

**Configuring Gemini AI:**
Create `.env.local` in the root folder:

```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Without an API key, all RSS reading and block features continue to work normally, with AI summaries disabled.

---

## 4. Building the Windows Executables (.exe)

```bash
npm run build:win
```

Output generated inside `release\`:

| File | Type |
|---|---|
| `Radar RSS Setup X.Y.Z.exe` | **NSIS Installer** — Recommended (supports background auto-updates) |
| `Radar RSS X.Y.Z.exe` | **Portable Executable** — Runs standalone without installation |

---

## 5. Building the Android Mobile App (.apk)

1. **Build web assets and sync Capacitor:**
   ```bash
   npm run build:android
   ```

2. **Assemble Debug APK:**
   ```powershell
   cd android
   .\gradlew.bat assembleDebug
   ```
   The generated APK will be placed at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 6. Publishing Releases (GitHub Releases)

The installed Windows desktop app checks for updates automatically upon opening. To release a new version:

### 6.1. One-time Setup
1. Ensure the repository name matches in `package.json` under `build.publish` (`dznass-cmd/RadarRSS`).
2. Export your GitHub Personal Access Token in PowerShell:
   ```powershell
   $env:GH_TOKEN="ghp_..."
   ```

### 6.2. Publishing a Version
1. Bump the `"version"` field in `package.json` (e.g., `"0.0.3"`).
2. Run:
   ```bash
   npm run publish:win
   ```
3. The installer, portable binary, blockmap, and `latest.yml` will be uploaded directly to GitHub Releases.

### 6.3. Automated Releases (GitHub Actions)
Pushing a version tag triggers `.github/workflows/release.yml` to automatically build and release the binaries:
```bash
git add .
git commit -m "Release v0.0.3"
git tag v0.0.3
git push origin main --tags
```

---

## 7. License

This project is licensed under the [MIT License](LICENSE).
