# Sea Service Logger — Launch Guide

Everything needed to go from this codebase to a live Google Play listing.

---

## Step 1 — Generate and place icons

Open `generate-icons.html` in Chrome and click **Download all**.

Place files as follows:

| Downloaded file | Destination |
|---|---|
| `icon-512.png` | `assets/icon-512.png` |
| `icon-192.png` | `assets/icon-192.png` |
| `ic_launcher_xxxhdpi.png` | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` |
| `ic_launcher_round_xxxhdpi.png` | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` |
| `ic_launcher_xxhdpi.png` | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` |
| `ic_launcher_round_xxhdpi.png` | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` |
| `ic_launcher_xhdpi.png` | `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` |
| `ic_launcher_round_xhdpi.png` | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` |
| `ic_launcher_hdpi.png` | `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` |
| `ic_launcher_round_hdpi.png` | `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` |
| `ic_launcher_mdpi.png` | `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` |
| `ic_launcher_round_mdpi.png` | `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` |

---

## Step 2 — Install Android Studio

Download from: https://developer.android.com/studio

During install, accept the Android SDK licence. The default SDK location is fine.

Once installed, open Android Studio once so it completes SDK setup.

---

## Step 3 — Generate the release keystore (one time only)

Run from the project root:

```bash
npm run keygen
```

You will be prompted for:
- A keystore password (store it securely — you need it for every future release)
- Your name / organisation / location (used in the certificate, not shown to users)

This creates `release.keystore` in the project root. It is gitignored. **Back it up immediately** — losing it means you can never update the app on Play Store under the same listing.

Set environment variables so Gradle can sign the build:

```bash
# Windows — run in Command Prompt before opening Android Studio
set SSL_STORE_PASS=your_keystore_password
set SSL_KEY_PASS=your_keystore_password
```

Or add them to your system environment variables permanently via:
> Control Panel → System → Advanced system settings → Environment Variables

---

## Step 4 — Build the release AAB

```bash
npm run sync
```

Then in Android Studio:
1. Open the `android/` folder as a project
2. Wait for Gradle sync to complete
3. Menu: **Build → Generate Signed Bundle / APK**
4. Choose **Android App Bundle**
5. Select `release.keystore`, enter passwords, alias `ssl-release`
6. Build type: **release**
7. Click **Finish**

The AAB will be at:
```
android/app/release/app-release.aab
```

---

## Step 5 — Google Play Console setup

### 5.1 Create developer account

1. Go to https://play.google.com/console
2. Sign in with a Google account
3. Pay the one-time $25 USD developer registration fee
4. Complete identity verification (takes up to 48 hours)

### 5.2 Create the app listing

**App name:** Sea Service Logger

**Short description (80 chars max):**
```
Daily sea service log for maritime professionals. USCG & MCA compliant.
```

**Full description (4000 chars max):**
```
Sea Service Logger is the dedicated sea service tracking tool for deck crew, officers, 
and maritime professionals applying for USCG/NMC or MCA credentials.

Stop reconstructing your sea service from memory at the end of a contract. Log each day 
in under 10 seconds — status, waters type, hours, and location — and the app builds your 
compliance record automatically.

DAILY LOGGING
• One-tap logging from the dashboard
• Log today in under 10 seconds
• Retroactive entry: fill in missed days from the calendar view
• GPS auto-fills your location

COMPLIANCE TRACKING
• USCG/NMC rules: 4-hour minimum, 1.5× credit for COI two-watch 12-hour days
• MCA (UK) rules: days as logged
• Automatic 3-year and 5-year day breakdowns for endorsement applications
• Waters breakdown: inland, near coastal, offshore, Great Lakes
• Duplicate day detection across multiple vessels

VESSEL MANAGEMENT
• Store multiple vessels with GRT, propulsion, flag, and official number
• COI two-watch flag for 12-hour day eligibility
• Captain name and email stored per vessel for one-tap document sending

DOCUMENT EXPORT (Pro)
• USCG Form CG-719S — auto-filled from your log, ready for captain signature
• MCA Sea Service Testimonial — compliant with MSN 1856 (M+F)
• Pre-filled applicant and vessel details, correct waters breakdown, signature fields

OFFLINE FIRST
• Works entirely without an internet connection
• Your records are stored on your device
• Internet required only for PDF export

FREE TIER
• Log up to 90 days (one full contract) at no cost
• Full access to the calendar and compliance stats
• Upgrade to Pro for unlimited logging and document export

DESIGNED FOR MARINERS
• Terminal-style design built for on-watch use
• Portrait-locked, one-handed operation
• No ads, no tracking
```

**Category:** Productivity  
*(Alternative: Health & Fitness — Productivity is more appropriate)*

**Tags / keywords:** sea service, maritime, USCG, NMC, MCA, CG-719S, mariner, deck crew, logbook, sailing

### 5.3 Store listing assets required

| Asset | Size | Notes |
|---|---|---|
| App icon | 512 × 512 PNG | Use `icon-512.png` from `assets/` |
| Feature graphic | 1024 × 500 PNG | Create in Canva or similar — dark charcoal bg, orange accent, app name |
| Screenshots (phone) | 2–8 screenshots | Minimum 2 required. See screenshot guide below |

**Screenshot guide — capture these screens on a phone or emulator:**
1. Dashboard with a vessel selected and day counter showing
2. Log entry bottom sheet open (status/waters/hours controls visible)
3. Calendar view with several logged days coloured
4. Profile screen showing career stats and export buttons
5. Upgrade sheet (Pro pricing)

### 5.4 Content rating

In Play Console → Content Rating, complete the questionnaire:

- Does the app contain user-generated content shared with others? **No**
- Does the app allow real-time interaction with other users? **No**
- Does the app contain violence? **No**
- Does the app contain sexual content? **No**
- Does the app access precise location? **Yes** (explain: auto-fills log entry location field)

Expected rating: **Everyone** or **Everyone 10+**

### 5.5 Privacy policy URL

Host the app (including `privacy.html`) on Vercel or Cloudflare Pages, then enter the URL:
```
https://your-domain.com/privacy.html
```

To deploy on Vercel (free):
```bash
npm install -g vercel
vercel --prod
```

The privacy policy URL is required before the app can be published.

---

## Step 6 — QA checklist

Test on a real Android device or emulator before submitting.

### Core logging
- [ ] Add a vessel (name, official number, GRT, propulsion)
- [ ] Log today — underway, near coastal, 8h
- [ ] Log today — at anchor, 8h
- [ ] Log today with GPS location auto-fill
- [ ] Edit an existing log entry from the calendar
- [ ] Log a retroactive date (tap a past day in calendar)
- [ ] Switch active vessel from dashboard chip

### Compliance
- [ ] Career stats update after each log entry
- [ ] Days past 3 years and 5 years calculate correctly
- [ ] Waters breakdown totals are correct
- [ ] NMC month equivalent shows (days ÷ 30)

### Paywall
- [ ] Tapping CG-719S export button opens upgrade sheet
- [ ] Tapping MCA export button opens upgrade sheet
- [ ] "Notify me" button confirms in-place (no redirect)
- [ ] Log button shows "Upgrade to continue" after 90 unique days logged (test with manual localStorage injection if needed)
- [ ] Free tier banner appears when ≤15 days remaining

### Offline
- [ ] Enable airplane mode
- [ ] App loads and all 3 tabs function
- [ ] Log an entry — it saves
- [ ] Calendar correctly shows the new entry
- [ ] Compliance stats update

### PDF export (online)
- [ ] After disabling paywall temporarily in tier.js: CG-719S generates and downloads
- [ ] Monthly table totals match Box 1
- [ ] MCA testimonial generates with correct vessel and date fields

### Legal pages
- [ ] Profile → Privacy Policy link opens privacy.html
- [ ] Profile → Terms of Service link opens terms.html

### Navigation
- [ ] Tab bar switches between all 3 screens
- [ ] Bottom sheet closes on overlay tap and close/cancel buttons
- [ ] No crash on first launch with no data

---

## Step 7 — Submit for review

In Google Play Console:

1. Upload the `.aab` file: **Release → Production → Create new release → Upload**
2. Enter release notes:
   ```
   Initial release. Daily sea service logging for maritime professionals with USCG and MCA compliance tracking.
   ```
3. Review the pre-launch report (Play Console runs automated tests — check for crashes)
4. Submit for review

**Expected review time:** 1–3 business days for a new app. You will receive an email when approved or if issues are found.

---

## Update workflow (after launch)

Every time you ship a code change:

```bash
# 1. Increment versionCode and versionName in android/app/build.gradle
# 2. Sync and build
npm run sync

# 3. Build new AAB in Android Studio (Build → Generate Signed Bundle)
# 4. Upload to Play Console → Production → Create new release
```

Rule: `versionCode` must always increase by at least 1 between releases. `versionName` is the human-readable version shown in the store (e.g. "1.1.0").

---

## File reference

```
project root
├── android/                     Capacitor Android project
│   └── app/
│       ├── build.gradle         Signing config, SDK versions, version code
│       └── src/main/
│           ├── AndroidManifest.xml   Permissions, orientation
│           └── res/mipmap-*/    Launcher icons (replace with generated icons)
├── assets/
│   ├── icon-192.png             PWA manifest icon (generate with generate-icons.html)
│   └── icon-512.png             PWA manifest icon + Play Store listing icon
├── capacitor.config.json        App ID, webDir, Android scheme
├── generate-icons.html          Run in browser to generate all icon sizes
├── package.json                 npm scripts: build, sync, android, keygen
├── privacy.html                 Privacy policy (host publicly, link in Play Console)
├── terms.html                   Terms of service
├── release.keystore             GITIGNORED — back this up offline immediately
└── LAUNCH.md                    This file
```
