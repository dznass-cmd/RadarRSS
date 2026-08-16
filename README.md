<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/92692107-6853-47c1-9104-d11333cebf75

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Desktop app (Windows)

The app also ships as a native Windows desktop application (Electron):

- `npm run desktop` — build and run in an Electron window (no packaging)
- `npm run build:win` — build the Windows executables into `release/`
  - `Radar RSS Setup X.Y.Z.exe` — installer (supports auto-update)
  - `Radar RSS X.Y.Z.exe` — portable, no install needed (no auto-update)

For the AI features, create a `.env` file next to the `.exe` with `GEMINI_API_KEY=...`.

### Automatic updates via GitHub Releases

The app checks for updates on startup using [electron-updater](https://www.electron.build/auto-update).
The update feed is resolved in this order:

1. `UPDATE_FEED_URL` in the `.env` next to the `.exe` (generic HTTP server)
2. `GH_OWNER` + `GH_REPO` in the `.env` (GitHub Releases, no rebuild needed)
3. The `publish` config in `package.json` (baked in at build time)

**To publish a new version to GitHub Releases:**

1. Set the `owner` and `repo` under `build.publish` in `package.json`
   (currently `dznass-cmd` / `RadarRSS`).
2. Export a token with `repo` scope: `GH_TOKEN=...` (PowerShell: `$env:GH_TOKEN="..."`).
3. Bump the `version` in `package.json` and run:

   ```
   npm run publish:win
   ```

   This uploads the installer, `.blockmap` and `latest.yml` as a **published** GitHub release.
   Every installed copy of the app will then update automatically.

**Fully automatic:** the workflow in `.github/workflows/release.yml` builds on
Windows and publishes the release by itself whenever you push a tag (`v2.0.4`,
`v2.0.5`, ...) — no local build needed.

For a **private repository**, also set `"private": true` in the publish config — the app
picks up `GH_TOKEN`/`GITHUB_TOKEN` from the `.env` at runtime to download updates.
