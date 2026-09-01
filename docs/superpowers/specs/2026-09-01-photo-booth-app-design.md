# Photo Booth Kiosk App — Design Spec

Date: 2026-09-01
Status: Approved, ready for implementation planning

## Purpose

A dedicated Android photo booth, running on a Samsung Galaxy Z Flip 7 propped up at
the venue. Guests pick a 1/2/3/4-photo strip mode, the booth walks them through a
countdown-driven capture sequence, stamps the camp sign + #CampJavery into the
bottom-right corner of every individual photo, composites them into one
Instagram-ready strip, and lets them email and/or text themselves a copy — while
the strip also lands in the existing shared guest gallery, tagged as "Photo Booth" so
it's filterable alongside regular guest uploads.

## Non-goals

- No native Android (Kotlin/CameraX) build — the app is a Capacitor-wrapped web app,
  reusing the existing site's watermarking approach and backend.
- No native Samsung Flex Mode split-screen (camera-on-top/controls-on-bottom when
  half-folded). That requires a custom native plugin bridging Android's
  `WindowManager` fold-posture APIs into the WebView; out of scope for v1. The app
  runs full-screen; propping the folded phone up still works fine as a physical
  stand, it just won't auto-split its own layout.
- No guest accounts/authentication for the booth itself — same trust model as the
  existing `/upload` flow.
- No offline queueing of sends — if the venue's connectivity drops, sending fails
  with a retry option (the strip is already uploaded and safe; only the
  email/SMS step needs a retry).
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
- **Per-photo watermark**: each captured shot gets the camp sign stamped into its
  own bottom-right corner (same bottom-right placement `addWatermark()` already
  uses in `src/lib/watermarkImage.js`, extended with "#CampJavery" rendered as
  small text directly beneath the sign, so every individual photo in the strip
  carries both the logo and the hashtag — not just the strip as a whole). Uses the
  new sign artwork already saved at `public/camp-sign-new.png` on the main site;
  implementation copies it into `photo-booth-app`'s own assets.
- **Strip compositing, Instagram-ready sizing**: a new canvas function modeled on
  the same pattern as `watermarkImage.js`, stacking the N already-watermarked shots
  vertically into one fixed-size canvas matched to a standard Instagram ratio so
  guests can post the result directly with no cropping:
  - **1-photo mode** → 1080×1350 canvas (4:5 portrait feed ratio).
  - **2/3/4-photo modes** → 1080×1920 canvas (9:16 Stories/Reels ratio) — tall
    enough for stacked photos to read as a real strip rather than being crammed
    into a shorter ratio. The canvas height divides evenly across the N shots
    (e.g. four 1080×480 tiles for the 4-photo mode), each carrying its own
    corner watermark from the per-photo step above.
- Reuses the main site's color/font tokens (copied, not shared as a package — this
  is a one-off wedding app, not worth monorepo tooling) so the booth visually
  matches the rest of Camp Javery branding.

### Backend (`server/index.js`, extending the existing Express app)

Two new routes, following the existing rate-limiter/handler conventions:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/photobooth/upload` | POST | none (public, rate-limited) | Uploads the composited strip |
| `/api/photobooth/send` | POST | none (public, rate-limited) | Emails/texts the strip to the guest |

- `photoUploadRateLimiter`-style limiter reused/cloned for `/api/photobooth/upload`.
- A new, tighter limiter for `/api/photobooth/send` (e.g. 10 sends / 10 min / IP) —
  it triggers paid Twilio sends, so it needs its own ceiling separate from the
  free upload path.
- `/api/photobooth/upload` reuses `uploadPhoto()` from `photoStorage.js`, but with a
  `booth-` pathname prefix (e.g. `guest-photos/booth-<id>__<name>.jpg`) instead of
  the plain guest-upload prefix — same blob store, same `guest-photos/` prefix so it
  already shows up in `listPhotos()`, just distinguishable by pathname.
- `/api/photobooth/send` takes `{ photoUrl, guestName, email, phone }`, and sends via:
  - **Resend** (email) — provisioned via Vercel Marketplace; `RESEND_API_KEY` and
    `RESEND_EMAIL_DOMAIN` (`campjavery.com`) are already in `.env.local`. Domain
    still needs DNS verification in the Resend dashboard before real sends work
    (see Setup Requirements).
  - **Twilio MMS** (SMS) — not a Vercel Marketplace integration, so this is a
    standard third-party setup: you create a Twilio account, buy a phone number,
    and I add `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` to
    `server/.env`. Twilio's MMS `MediaUrl` parameter takes the already-uploaded
    blob's public URL directly — no re-encoding or duplicate upload needed.
  - If both email and phone are provided, both sends fire; the response reports
    per-channel success/failure so the Delivery screen can show "Emailed ✓ /
    Texting failed, retry?" rather than an all-or-nothing result.

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

1. **Twilio**: create an account, buy a phone number capable of MMS in your region,
   provide the Account SID / Auth Token / phone number.
2. **Resend domain verification**: `campjavery.com` is provisioned as the sending
   domain, but Resend requires DNS records (SPF/DKIM) added at your domain
   registrar before it'll send real (non-sandbox) email. I'll provide the exact
   records once we reach implementation.
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
- Send failure (`/api/photobooth/send`) → Delivery screen reports which channel(s)
  failed with a retry button scoped to just the failed channel(s); a successful
  channel isn't re-sent.
- Rate limit hit → friendly inline message, no crash.
- Idle timeout mid-flow (guest walks away) → after ~60s of inactivity on any screen
  but Home, auto-return to Home so the booth doesn't get stuck for the next guest.

## Testing

Manual testing on the physical Z Flip 7, following the existing
`TESTING_GUIDE.md` conventions:

- Capture flow for all four modes (1/2/3/4), confirming countdown timing and
  correct shot count in the final strip.
- Confirm each photo's corner watermark (sign + #CampJavery) stays legible at the
  smaller tile sizes in the 3- and 4-photo strips, and that the 4:5 (1-photo) and
  9:16 (2/3/4-photo) canvases both come out as valid, croppable-free Instagram
  dimensions.
- Retake flow discards the in-progress strip and restarts cleanly.
- Delivery: email-only, phone-only, and both — confirm real inbox/phone delivery.
- Confirm a partial failure (e.g. valid email + invalid phone) reports per-channel
  status instead of failing the whole send.
- Confirm booth strips appear in `/gallery` tagged as "Photo Booth" and the filter
  tab correctly separates them from regular guest uploads.
- Confirm idle timeout returns to Home from every screen.
- Confirm rate limiting on `/api/photobooth/send` kicks in and recovers.
- Install the built `.apk` via sideload on the Z Flip 7 and confirm it launches,
  requests camera permission, and runs full-screen with the phone propped up in a
  half-folded stand position.
