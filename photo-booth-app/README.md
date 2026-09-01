# Camp Javery Photo Booth

A Capacitor-wrapped Android app for the wedding photo booth kiosk (Samsung Galaxy Z Flip 7).

## Local development (web preview, no camera)

```bash
npm install
cp .env.example .env   # set VITE_BACKEND_URL to your local or deployed backend
npm run dev
```

The live camera preview (`@capacitor-community/camera-preview`) and the SMS share-intent (`camp-javery-sms-share`, see below) only work inside the native Android shell — the web dev server is useful for iterating on the Home/Review/Delivery screens, but Capture and the "text it to yourself" button both require a real device. On the web, the SMS button fails with Capacitor's own "plugin is not implemented on web" error, which the Delivery screen displays and offers to retry — that's expected, not a bug.

## Building the APK

**Option A — GitHub Actions (no local Android tooling needed):**
Push to `main` (or run the workflow manually from the Actions tab) — `build-photo-booth-apk.yml` produces a downloadable `photo-booth-debug-apk` artifact.

**Option B — Local build (for on-device debugging via USB):**
1. Install [Android Studio](https://developer.android.com/studio) (bundles the JDK, Android SDK, and Gradle).
2. `npm run build && npx cap add android && npx cap sync android`
3. Add `<uses-permission android:name="android.permission.CAMERA" />` to `android/app/src/main/AndroidManifest.xml` (not merged in automatically by the camera-preview plugin — see the CI workflow for the equivalent automated step).
4. Open `android/` in Android Studio, or run `cd android && ./gradlew assembleDebug` from the terminal.
5. Connect the Z Flip 7 via USB with USB debugging enabled, then `npx cap run android` for live-reload development.

## Installing on the kiosk device

Transfer the built `.apk` to the Z Flip 7 (e.g. via Google Drive, or `adb install app-debug.apk` over USB), enable "Install unknown apps" for whatever app you used to transfer it, and install. There's no Play Store distribution — this never leaves your own device(s).

## Texting — no backend, no account needed

Android won't let a regular app send MMS silently (only the phone's *default*
SMS handler can) — so texting isn't a server integration at all. The custom
`camp-javery-sms-share` plugin (`plugins/sms-share/`) writes the strip to a
local cache file and opens the phone's own Messages app via an `ACTION_SEND`
intent, with the recipient pre-filled and the image attached. A human (the
guest or the booth attendant) taps **Send** once inside Messages. No Twilio,
no per-message cost.

The plugin's native source lives in `plugins/sms-share/` (a proper local
Capacitor plugin package, referenced via a `file:` dependency in
`package.json`) rather than inside `android/` — `android/` is gitignored and
regenerated fresh by every `cap add android`, so hand-written native code
placed directly in it would be lost. `cap sync` auto-discovers the plugin
from `node_modules` and wires it into the generated Gradle project every
time, matching how the official `@capacitor-community/camera-preview`
plugin's own native code works.

## Required backend setup (see the main repo's `.env.example`)

- `RESEND_API_KEY` / `RESEND_EMAIL_DOMAIN` — already provisioned. The `campjavery.com` domain still needs DNS verification in the [Resend dashboard](https://resend.com/domains) before real email sends work — add the SPF/DKIM records it shows you at your domain registrar.
