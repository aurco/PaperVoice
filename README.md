# PaperVoice

A paper-textured voice-notes app with an Android 17–style 1×1 widget, a three-step recording popup, a floating bubble and a filterable audio dashboard. It runs in the browser and also ships as an installable Android APK.

<p align="center">
  <img src="https://github.com/aurco/PaperVoice/blob/main/dashboard.png" width="200" alt="Dashboard with search and filters">
</p>

## Features

- **1×1 widget recording popup.** Recording takes three steps: record (with pause, resume, cancel and a live waveform), then a title and note, then tags (choose existing ones or create new ones).
- **Floating bubble.** You can minimise a recording in progress to a draggable bubble, then tap the bubble to pick up where you left off.
- **Dashboard.** Search notes and filter them by date, month or year, by read or unread, and by tag. You can also manage tags and play recordings inline.
- **Recording detail.** Each recording has a seekable waveform player, playback speeds from 1× to 2×, notes, tags, delete and share options.
- **Bulk Quick Share.** Download every recording, copy a text list of all notes, or send them through the system share sheet.
- **Android 17 preview.** A simulated phone shows the 1×1 widget on the lock screen and the home screen. A code viewer has Kotlin/XML reference snippets for a native build: activity, widget provider, manifest and audio recorder.
- **Local-only data.** Notes and tags are stored in `localStorage`. The Android build also stores the audio in IndexedDB, so recordings still play after the app restarts.

On first launch the app loads six sample recordings so the dashboard isn't empty.

## Install on Android

1. Download `PaperVoice.apk` from the [latest release](../../releases/latest). It needs Android 10 or newer.
2. Open the file on your phone and allow installs from that source when Android asks. If Play Protect warns about an unknown developer, choose **Install anyway**.
3. Android asks for microphone permission the first time you record.

The Android build connects the web app to the phone in a few ways:
- **Share** opens the Android share sheet.
- **Copy** uses the system clipboard.
- **Download** saves files to `Downloads/PaperVoice/`.
- Recorded audio stays available after the app is closed.

## Run locally

You need a current LTS version of Node.js.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serves the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |

You don't need an API key. `.env.example` and the `@google/genai` dependency came with the AI Studio template, but the app never calls Gemini.

Browsers only allow microphone access on `localhost` or HTTPS. If you open the dev server from another device using your LAN IP over plain HTTP, the microphone is blocked. The recorder then falls back to a generated placeholder tone.

## Build the Android APK

The APK is a minimal native shell around the web app, with no Capacitor or Gradle. `apk-build/android-shell` is an [Apktool](https://apktool.org) project. It contains the manifest, theme, adaptive icon and five small classes written in smali.

**Requirements:** Java 17+, Apktool 2.12+ and the Android SDK build-tools (`zipalign`, `apksigner`).

1. **Copy the Android-specific changes into `src/`.** In a normal browser they do nothing.

   ```bash
   cp -R apk-build/web-changes/src/. src/
   ```

   These are full copies of the changed files. If you've edited `App.tsx`, `main.tsx`, `services/storage.ts` or `utils/audioEngine.ts` since, merge those files by hand instead of copying.

2. **Build the web app and copy it into the shell.**

   ```bash
   npm run build
   rm -rf apk-build/android-shell/assets/www
   mkdir -p apk-build/android-shell/assets/www
   cp -R dist/. apk-build/android-shell/assets/www/
   ```

3. **Bump the version.** Raise `versionCode` (and `versionName` if you like) in `apk-build/android-shell/apktool.yml`.

4. **Package, align and sign the APK.**

   ```bash
   apktool b apk-build/android-shell -o build/unsigned.apk
   zipalign -f -p 4 build/unsigned.apk build/aligned.apk
   apksigner sign --ks apk-build/signing/papervoice-release.jks --ks-key-alias papervoice \
     --out build/PaperVoice.apk build/aligned.apk
   apksigner verify --print-certs build/PaperVoice.apk
   ```

> [!IMPORTANT]
> Every update must be signed with the same key (`apk-build/signing/`). If you sign with a different key, users have to uninstall first, which deletes their recordings. Keep a backup of the key and **never commit it**. It is already listed in `.gitignore`.

### How the shell works

| Class | Role |
| --- | --- |
| `MainActivity` | Hosts a WebView and loads `https://appassets.androidplatform.net/index.html` |
| `AssetClient` | Serves `assets/www` at that origin. Because it is a secure origin, `getUserMedia`, `localStorage` and IndexedDB all work. External links open in the browser. |
| `Chrome` | Maps the page's microphone request to the `RECORD_AUDIO` runtime permission |
| `Bridge` | Exposes `window.PaperVoiceAndroid` (`shareText`, `copyText`, `saveFile`, `toast`). `src/android-bridge.ts` uses it to back `navigator.share`, the clipboard and downloads. |

The package is `com.papervoice.app`, with `minSdk` 29 (Android 10) and `targetSdk` 34. WebView remote debugging is enabled, so you can inspect the app from `chrome://inspect` on a computer.

## Project structure

```
src/
  App.tsx                    App state, modals, toasts
  components/
    Dashboard.tsx            Search, filters, tag manager, recording list
    WidgetPopup.tsx          3-step recording popup
    FloatingBubble.tsx       Minimised recording bubble
    RecordingDetailModal.tsx Player, notes, tags, share options
    BulkQuickShareModal.tsx  Bulk download / copy / share
    PhoneSimulator.tsx       Android 17 lock screen and home screen preview
    AndroidCodeModal.tsx     Kotlin/XML reference snippets
  services/storage.ts        localStorage persistence and sample data
  utils/audioEngine.ts       MediaRecorder capture, waveform, fallback tone
apk-build/
  android-shell/             Apktool project for the native wrapper
  web-changes/               Android-related source changes and offline build scripts
  signing/                   Release key (git-ignored)
docs/screenshots/
```

## Known limitations

- The lockscreen widget, the floating bubble, the Quick Share device list and the phone view are all simulated inside the app. Nothing is added to the real Android home screen or lock screen yet.
- "MP3" is only a label. Recordings are actually WebM/Opus (from `MediaRecorder`) or WAV (the fallback tone). The Android build saves downloads with the correct file extension. The browser build names every download `.mp3`.
- In the browser build, recorded audio is kept only in memory. After a page reload, older recordings play a placeholder tone. The Android build fixes this; see `apk-build/web-changes`.
- The fonts (Plus Jakarta Sans and Space Mono) load from Google Fonts. Offline, the system font is used instead.

## Credits

- Prototyped in Google AI Studio: [view the original app](https://ai.studio/apps/2d89b304-ad42-430d-abcd-9d67c7c22c0b)
- Built with React 19, Tailwind CSS 4 and Vite, with icons from [Lucide](https://lucide.dev) (ISC)

## License

The source is marked Apache-2.0 in its SPDX header. Add the full license text as `LICENSE` before you publish.
