# Photo Booth Kiosk App — Design Spec

Date: 2026-09-01
Status: Approved, ready for implementation planning

## Purpose

A dedicated Android photo booth, running on a Samsung Galaxy Z Flip 7 propped up at
the venue. Guests pick a 1/2/3/4-photo strip mode, the booth walks them through a
countdown-driven capture sequence, composites the shots into one Instagram-ready
strip, and lets them email and/or text themselves a copy — while the strip also
lands in the existing shared guest gallery, tagged as "Photo Booth" so it's
filterable alongside regular guest uploads.

## Non-goals

- No full native Android (Kotlin/CameraX) app — the app is a Capacitor-wrapped
  web app, reusing the existing site's watermarking approach and backend. One
  small custom native plugin (the SMS/Messages share-intent, see Backend &
  delivery) is the only native code involved — everything else is JS/React.
- No native Samsung Flex Mode split-screen (camera-on-top/controls-on-bottom when
  half-folded). That requires a custom native plugin bridging Android's
  `WindowManager` fold-posture APIs into the WebView; out of scope for v1. The app
  runs full-screen; propping the folded phone up still works fine as a physical
  stand, it just won't auto-split its own layout.
- No guest accounts/authentication for the booth itself — same trust model as the
  existing `/upload` flow.
- No offline queueing of sends — if the venue's connectivity drops, the email
  send fails with a retry option (the strip is already uploaded and safe; only
  the email step needs a retry). The Messages share-intent for texting doesn't
  need connectivity at all until the guest actually taps Send inside Messages.
- Not distributed to guests' own phones — one (or two) kiosk devices, set up by
  Jared/Avery, not something guests install.

## Architecture

New top-level directory `photo-booth-app/` — an independent Vite + React project
wrapped in Capacitor, **separate from** the main `simple_summer_camp_wedding` site
(so the kiosk can never navigate to the RSVP/registry/chatbot). It talks to the
**same existing Express backend** (`server/`) — no new backend service.

### Frontend (`photo-booth-app/`, Vite + React + Capacitor)

- `@capacitor/core` + `@capacitor/android` for the native shell.
- `@capacitor-community/camera-preview` for a live rear-camera viewfinder with
  programmatic start/stop/capture — needed for the countdown-driven multi-shot
  sequence, which a plain file-picker (`@capacitor/camera`) can't do.
- Screens (single-page state machine, no router needed — this app has one flow):
  1. **Home** — "1 / 2 / 3 / 4 Photos" buttons over the camp branding.
  2. **Capture** — live preview, 3-2-1 countdown before each shot, auto-advances
     through the selected count, brief freeze-frame between shots.
  3. **Review** — shows the composited strip; **Retake** (back to Capture, same
     mode) or **Looks Good** (uploads the strip, moves to Delivery).
  4. **Delivery** — guest enters name (defaults to "Photo Booth Guest" if left
     blank — this is a shared kiosk, typing a full name every time is friction) and
     an email and/or phone number, taps **Send**. Confirmation screen, then an idle
     timeout (~20s) returns to Home for the next guest.
- **No per-photo watermark**: captured shots are used as-is, unmodified — no sign
  or hashtag is stamped onto the individual photos.
- **Strip compositing, Instagram-ready sizing**: a canvas function that stacks the
  N captured shots vertically into one fixed-size canvas matched to a standard
  Instagram ratio so guests can post the result directly with no cropping:
  - **1-photo mode** → 1080×1350 canvas (4:5 portrait feed ratio).
  - **2/3/4-photo modes** → 1080×1920 canvas (9:16 Stories/Reels ratio) — tall
    enough for stacked photos to read as a real strip rather than being crammed
    into a shorter ratio. The canvas height divides evenly across the N shots
    (e.g. four 1080×480 tiles for the 4-photo mode).
- Reuses the main site's color/font tokens (copied, not shared as a package — this
  is a one-off wedding app, not worth monorepo tooling) so the booth visually
  matches the rest of Camp Javery branding.

### Backend (`server/index.js`, extending the existing Express app)

Two new routes, following the existing rate-limiter/handler conventions:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/photobooth/upload` | POST | none (public, rate-limited) | Uploads the composited strip |
| `/api/photobooth/send` | POST | none (public, rate-limited) | Emails the strip to the guest |

- `photoUploadRateLimiter`-style limiter reused/cloned for `/api/photobooth/upload`.
- A new, tighter limiter for `/api/photobooth/send` (e.g. 10 sends / 10 min / IP).
- `/api/photobooth/upload` reuses `uploadPhoto()` from `photoStorage.js`, but with a
  `booth-` pathname prefix (e.g. `guest-photos/booth-<id>__<name>.jpg`) instead of
  the plain guest-upload prefix — same blob store, same `guest-photos/` prefix so it
  already shows up in `listPhotos()`, just distinguishable by pathname.
- `/api/photobooth/send` takes `{ photoUrl, guestName, email }` and sends via
  **Resend** — provisioned via Vercel Marketplace; `RESEND_API_KEY` and
  `RESEND_EMAIL_DOMAIN` (`campjavery.com`) are already in `.env.local`. Domain
  still needs DNS verification in the Resend dashboard before real sends work
  (see Setup Requirements).

**Texting is not a backend integration.** No SMS provider is used —
Android does not allow a regular app to send MMS silently; only an app set
as the phone's *default* SMS handler can do that, which would be a much
bigger, more invasive change than a photo booth warrants (it would take
over the device's actual messaging). Instead, texting happens **entirely
on-device**: a small custom Capacitor plugin (`photo-booth-app/plugins/sms-share/`)
writes the strip to a local cache file and fires an Android
`ACTION_SEND` intent targeted at the phone's own default Messages app,
with the recipient's number pre-filled via the `address` extra and the
image attached via `EXTRA_STREAM`/`FileProvider`. This opens Messages with
everything already filled in — a human (the guest or the booth attendant)
taps **Send** once inside Messages to actually dispatch it. No account, no
per-message cost, no `TWILIO_*` env vars.

Email and text are independent: email fires automatically through the
backend, while "text it to yourself" is one tap after the Messages app
opens. The Delivery screen still collects both an email and phone field;
only email participates in the backend's per-channel retry logic described
below, since the text path has no server-side call to retry — if the
guest backs out of Messages without sending, they just tap "Send My
Photos" again to reopen it.

### Gallery integration (`GalleryPage.jsx`, `photoStorage.js`)

- `parsePhotoPathname()` in `photoStorage.js` gets extended to also detect the
  `booth-` prefix and return `{ name, source: 'photo-booth' | 'guest-upload' }`.
- `listPhotos()` passes `source` through in each photo's returned object.
- `GalleryPage.jsx` gets a simple filter/tab ("All" / "Photo Booth") over the
  existing grid — no new route, no new backend endpoint, just a client-side filter
  on the array `GET /api/photos` already returns.

### Build & distribution

- `npx cap add android` scaffolds the native Android project inside
  `photo-booth-app/`; `npx cap sync` copies the web build into it.
- The custom SMS-share plugin's Kotlin source lives in its own local package
  (`photo-booth-app/plugins/sms-share/`), **not** inside `android/` — `android/`
  is gitignored and regenerated fresh by every `cap add android` (locally and
  in CI), so anything hand-written directly in it would be lost. A proper
  Capacitor plugin package is auto-discovered and pulled into the generated
  `android/` project by `cap sync`, so its source survives regeneration.
- Producing the actual signed `.apk` needs a JDK + Android SDK + Gradle. **None of
  that is installed on this machine** (confirmed: no `java`, no Android Studio, no
  `$ANDROID_HOME`, no `gradle`/`adb`). Two options, both documented in the README:
  1. **Install Android Studio locally** (bundles JDK + SDK + Gradle) — best for
     actually iterating/debugging on the physical Z Flip 7 via USB during
     development.
  2. **GitHub Actions build** — a workflow (`.github/workflows/build-photo-booth-apk.yml`)
     that checks out the repo, sets up JDK + Android SDK
     (`android-actions/setup-android`), runs `./gradlew assembleDebug` inside
     `photo-booth-app/android`, and uploads the `.apk` as a downloadable build
     artifact. Works with zero local Android tooling, at the cost of a slower
     edit → download → sideload loop than local development.

  Recommendation: use Android Studio locally for development/testing (you'll want
  fast iteration on the camera flow), and the GitHub Actions workflow as a
  convenient way to produce a shareable `.apk` build without needing Android Studio
  every time. Installing the `.apk` on the kiosk device is a manual sideload (enable
  "Install unknown apps" for whatever app you transfer it with, e.g. Google Drive or
  a USB cable) — there's no Play Store distribution step since this never leaves
  your own device(s).

## Setup requirements (manual, not something I can do for you)

1. **Resend domain verification**: `campjavery.com` is provisioned as the sending
   domain, but Resend requires DNS records (SPF/DKIM) added at your domain
   registrar before it'll send real (non-sandbox) email. I'll provide the exact
   records once we reach implementation.
2. **Android build tooling** (unchanged from the Build & distribution section
   above): install Android Studio if you want local device debugging, or rely on
   the GitHub Actions build.
3. **Android build tooling**: install Android Studio (recommended) if you want to
   iterate/debug locally, or rely solely on the GitHub Actions build.

## Error handling

- Camera permission denied → clear in-app message with a button to open Android
  app settings.
- Capture/composite failure mid-sequence → return to Home with an inline error;
  no partial strips get uploaded.
- Upload failure (`/api/photobooth/upload`) → Review screen shows a retry button;
  the composited strip stays in memory client-side so retrying doesn't require
  retaking photos.
- Email send failure (`/api/photobooth/send`) → Delivery screen shows the error
  with a retry button for the email channel.
- SMS share-intent failure (e.g. no default Messages app resolvable, or the
  native call throws) → Delivery screen shows an inline error for the text
  channel; tapping "Send My Photos" again just re-attempts opening Messages.
- Rate limit hit → friendly inline message, no crash.
- Idle timeout mid-flow (guest walks away) → after ~60s of inactivity on any screen
  but Home, auto-return to Home so the booth doesn't get stuck for the next guest.

## Testing

Manual testing on the physical Z Flip 7, following the existing
`TESTING_GUIDE.md` conventions:

- Capture flow for all four modes (1/2/3/4), confirming countdown timing and
  correct shot count in the final strip.
- Confirm the 4:5 (1-photo) and 9:16 (2/3/4-photo) canvases both come out as
  valid, croppable-free Instagram dimensions.
- Retake flow discards the in-progress strip and restarts cleanly.
- Delivery: email-only, phone-only, and both — confirm the email actually
  lands in a real inbox, and confirm the phone number opens Messages with the
  strip attached and the number pre-filled, ready to send.
- Confirm submitting only a phone number doesn't call the backend at all
  (network tab should show no `/api/photobooth/send` request), and that email
  alone still works normally when no phone is entered.
- Confirm booth strips appear in `/gallery` tagged as "Photo Booth" and the filter
  tab correctly separates them from regular guest uploads.
- Confirm idle timeout returns to Home from every screen.
- Confirm rate limiting on `/api/photobooth/send` kicks in and recovers.
- Install the built `.apk` via sideload on the Z Flip 7 and confirm it launches,
  requests camera permission, and runs full-screen with the phone propped up in a
  half-folded stand position.
