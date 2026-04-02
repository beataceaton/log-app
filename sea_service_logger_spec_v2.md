# Sea Service Logger — Product Specification v2.0

> Mobile-first sea service tracking for maritime professionals.  
> MCA/NMC compliant record-keeping · AIS-assisted reconstruction · One-tap daily logging.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design Language & Aesthetics](#2-design-language--aesthetics)
3. [Information Architecture](#3-information-architecture)
4. [Vessel Management](#4-vessel-management)
5. [Session Logging](#5-session-logging)
6. [AIS Log Reconstruction (Premium)](#6-ais-log-reconstruction-premium)
7. [Document Generation](#7-document-generation)
8. [Tier Structure & Monetisation](#8-tier-structure--monetisation)
9. [Data Architecture & Backend](#9-data-architecture--backend)
10. [Growth Strategy & Industry Adoption](#10-growth-strategy--industry-adoption)
11. [Technical Stack](#11-technical-stack)
12. [Development Roadmap](#12-development-roadmap)
13. [Regulatory Compliance Checklist](#13-regulatory-compliance-checklist)

---

## 1. Project Overview

Sea Service Logger is a mobile-first progressive web application enabling maritime professionals to track and document sea service for MCA (UK) and USCG/NMC (US) credential qualification. The application targets the yachting industry specifically, where crew change frequently between vessels, handwritten logbooks are inconsistent, and end-of-contract documentation is a persistent pain point.

The core value proposition is twofold: eliminate the end-of-contract scramble to reconstruct months of service from memory or illegible handwritten logs, and generate compliance-ready documentation that captains can sign rather than compose from scratch.

### 1.1 The problem in detail

- Mariners routinely lose documentation when moving between vessels or employers
- Handwritten logs are illegible, incomplete, or lost entirely
- MCA/USCG forms require specific data (route type, waters, hours per day, GRT) that mariners do not think to record in real time
- End-of-contract document generation typically takes hours and requires chasing former employers for signatures
- AIS position data exists for every commercial vessel but is never used to assist mariners with log reconstruction

### 1.2 Target users

| User | Description |
|---|---|
| Deck crew / ratings | Primary user. Logs daily. Needs quick entry and clean PDF output at end of contract. |
| Deck officers (OOW/C/O) | Power user. Tracking toward next endorsement. Needs route breakdown, watchkeeping detail, 3-year officer letter compliance. |
| Captain | Secondary user. Verifies and signs crew documents. Potential mandate authority. Captain-tier account. |
| Maritime academy student | Aggregating early sea service from training voyages and work placements for first MMC/CoC. |
| Agency / management co. | B2B buyer. Wants fleet-level crew records without chasing individual spreadsheets. |

### 1.3 Regulatory scope

- **UK — MCA:** Maritime and Coastguard Agency. Relevant instruments: MSN 1856, MGN 69, MLN 1 series. Days defined as 8-hour watch or day work.
- **US — USCG/NMC:** National Maritime Center. Relevant: 46 CFR 10.107, 10.232, 13.127. Days defined as 8 hours; 4-hour minimum on vessels under 100 GRT; 12-hour two-watch credit on authorised vessels.
- **STCW 1978 (as amended):** Watchkeeping quality and navigational competence, not just time served.

> **Disclaimer note:** The app guides data entry toward compliance but does not validate credentials. The captain's signature remains the legal attestation. The app generates supporting evidence, not official documents.

---

## 2. Design Language & Aesthetics

The visual identity deliberately avoids the sanitised Apple-minimalism dominant in consumer apps. Instead it draws on Urbit's geometric clarity, cyberpunk terminal interfaces, alchemical symbolism, and radar navigation aesthetics. The result should feel like a serious instrument — purposeful, slightly arcane, satisfying to use.

### 2.1 Visual inspirations

| Reference | Influence |
|---|---|
| Urbit | Clean networks, purposeful geometry, monospace typography, limited palette, depth without gradients |
| Cyberpunk / imageboards (Arisuchan, Lainchan) | Dark interfaces, high contrast, terminal-like elements, layered UI |
| Alchemical symbolism | Occult geometry, elemental themes, circular/mystical forms — navigation glyphs as sigils, not icons |
| Make Noise synths | Stark geometric language, minimal intentional design, symbolic iconography. Every element earns its place |
| Radar interfaces | Navigation metaphor for time/distance/location. The sweep of a radar scope as a visual language for accumulated days |

### 2.2 Colour palette

#### Dark mode (primary)

| Role | Value |
|---|---|
| Background | Deep charcoal gradient `#1a1816` → `#0f0e0c` |
| Accent / interactive | Burnt orange `#ff8c32` |
| Primary text | Cream `#e8dcc4` |
| Secondary text | Muted brown `#a8987a` |
| Borders | Subtle warm grey `#3a3530` |
| Cards / panels | Slightly elevated charcoal `#252220` |

#### Light mode

| Role | Value |
|---|---|
| Background | Off-white/cream `var(--color-background-tertiary)` |
| Accent | Burnt orange `#d97706` |
| Cards | Light grey `var(--color-background-secondary)` |
| Text | `var(--color-text-primary)` / `var(--color-text-secondary)` |

### 2.3 Typography

- Monospace font throughout — `var(--font-mono)` / Courier New fallback
- Letter-spacing for terminal/radar aesthetic
- Sentence case always. No mid-sentence bolding. Bold reserved for headings and labels only
- `h1`: 18px mobile / 24px desktop, weight 500
- Section titles: 11px, uppercase, weight 500, letter-spacing 0.08em
- Labels: 12–13px weight 500 · Body: 13px weight 400 · Helper: 10–11px secondary colour

### 2.4 Navigation glyphs

The three bottom-tab glyphs are central to the identity. They are geometric symbols, not conventional icons, and carry deliberate semantic meaning.

| Glyph | SVG | Meaning | Destination |
|---|---|---|---|
| Hourglass / diamond | `<polygon points="12,2 22,12 12,22 2,12"/><line x1="12" y1="2" x2="12" y2="22"/>` | Passage of time, accumulation of days | Calendar view |
| Segmented circle | `<circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="19.78" y2="19.78"/>` | Time divided into logged segments. Central moment of daily action | Dashboard (default) |
| Ship's wheel / dharma wheel | 8-spoke wheel: outer circle + inner circle + 8 spokes at 45° intervals | Steering, control, the turning wheel of accumulated data | Profile / export |

### 2.5 Component patterns

- **Buttons:** 2px border, no fill by default; hover = border colour deepens; active = filled with orange
- **Inputs:** 1px border, 4px radius; focus = orange border + subtle shadow
- **Dashboard metric cards:** transparent (no background, no border) — label + value only
- **Panels / sections:** secondary background, minimal borders, whitespace as primary separator
- **Border radius:** 2–6px throughout. Restrained. Not rounded
- **Strokes:** 0.5–1px. Thin, precise

---

## 3. Information Architecture

The app is exactly three screens. There are no sub-menus, no modal stacks beyond a single bottom sheet, and no onboarding flows beyond a one-time vessel setup. Navigation is the bottom tab bar, always visible.

### 3.1 Three-screen model

| Tab | Theme | Purpose |
|---|---|---|
| Left — Calendar | Past | Monthly grid of logged days. Retroactive editing. Day-level detail on tap. |
| Centre — Dashboard | Present | The one Log button. Day counter. Live stats. Vessel chip. 90% of daily work. |
| Right — Profile / Export | Future | Document generation. Career stats. Vessel profiles. Account settings. |

> The left-to-right layout maps to past → present → future. Users internalise this without being told.

### 3.2 Dashboard (centre tab)

The dashboard's entire purpose is to make one action — logging today — as frictionless as possible.

- **Vessel chip** at top: vessel name, current role, live green dot if GPS active
- **Day counter:** large, prominent. Total days this contract. This is the number the user cares about
- **LOG button:** single large orange button. The only element that needs interacting with daily
- **On LOG press:** bottom sheet with three fields only — Status (Underway / At Anchor), Hours (8 or 12), Waters (pre-filled from yesterday, editable). Submit in under 5 seconds
- **Mini stats below button:** total career days, months of sea service, current waters, next endorsement milestone
- **Watchkeeping section** (optional, Settings-gated): bridge hours, watch type, equipment used, weather. Hidden by default. For STCW/MCA officers

### 3.3 Calendar (left tab)

The calendar makes retroactive editing easy — critical for onboarding and missed days. A sailor joining mid-contract should fill in two weeks in under two minutes.

- Month/year grid, swipe or arrow to navigate
- Each day colour-coded: underway (accent orange), in port (amber), off-hire / not logged (neutral)
- Tap a day → bottom sheet: Status, Route type (inland / near coastal / Great Lakes / offshore), Hours (8 or 12), optional notes
- **Multi-select:** press and drag to select a range → bulk-apply same status. Critical for retroactive entry of a full passage
- Vessel shown per day if multiple vessels served in the period. Colour stripe on left edge of day cell indicates vessel

> The most common NMC form errors are wrong route-water classification and wrong hours. The calendar edit sheet forces both fields on every edit, directly preventing the most frequent causes of form rejection.

### 3.4 Profile / Export (right tab)

- Profile card: name, MMC/CoC number, STCW endorsements held
- Career stats: total days, hours, days by route type, vessels served
- Vessel profiles: list of all vessels with stored name/official number/GRT/propulsion/flag
- Document generation: four output types (see Section 7)
- Account settings: units (NM/km), regulatory framework (MCA/USCG/both), notifications, cloud sync, stored captain email addresses

---

## 4. Vessel Management

Vessel data is the backbone of every compliant document. Getting it right at setup eliminates the most common downstream form errors.

### 4.1 Vessel profile fields

| Field | Notes |
|---|---|
| Vessel name | Free text. Used in all generated documents |
| Official number / IMO | Numeric. Used in CG-719S and sea service letters. Critical — fabricated numbers cause form rejection |
| State registration number | US state-registered vessels. Alternative to official number |
| Flag state | For STCW waters classification |
| Vessel type | Motor Yacht / Sailing Yacht / Motor Vessel / Tug / Supply Boat / Tanker / Other |
| Propulsion | Motor / Sail / Aux Sail / Steam / Gas Turbine. Affects auxiliary sail endorsement eligibility |
| GRT (gross registered tons) | Critical for tonnage-limited endorsements. If unknown, offer length/beam/depth inputs so app can estimate displacement |
| Engine HP | Required for sea service letter format |
| COI authorised watch system | Two-watch (6-on/6-off) = 12-hour day credit eligible. One-watch = 8-hour only |
| Captain name + email | Pre-fills attestation letters. Stored per vessel for Gmail integration |

> If GRT is unknown, collect Length / Beam / Depth and compute an approximate GRT using: **GRT ≈ 0.353 × L × B × D**. Display as estimated and flag it in generated documents.

### 4.2 Auto-population behaviour

- On app open: last-used vessel pre-selected
- Switching vessels mid-contract: add new vessel inline from the dropdown. Start/end dates stored per vessel separately
- Multiple vessels in one calendar period: vessel assigned per day cell. Colour stripe on calendar indicates which vessel
- Maximum two vessels per calendar month is a soft warning (rare edge case, but valid)

---

## 5. Session Logging

### 5.1 Daily log entry — required fields

| Field | Behaviour |
|---|---|
| Vessel | Pre-selected from last session. Changeable |
| Date | Auto: today. Retroactive entry fully supported |
| Status | Underway / At Anchor or Docked — binary choice |
| Waters | Inland / Near Coastal / Offshore / Great Lakes. Pre-filled from yesterday |
| Hours today | 8 or 12. 12 only available if vessel COI authorises two-watch system |
| Location | Auto-filled from GPS if available. Manual text entry fallback. Format: `39.50°N / 19.82°E` or place name |

### 5.2 Daily log entry — optional watchkeeping section

Gated behind Settings toggle **"Enable watchkeeping tracking"**. For STCW/MCA deck officers.

| Field | Behaviour |
|---|---|
| Bridge watch hours | Numeric, step 0.5. Subset of hours today |
| Watch type | Navigational watch / Anchor watch (checkboxes) |
| Navigation equipment | Radar / ECDIS / GPS plotting / AIS (checkboxes). STCW II/1 competency evidence |
| Weather conditions | Brief textarea. Wind force, sea state, visibility |
| Distance run (NM) | Auto-calculated from GPS track if underway. Manual override. Hidden when At Anchor |

### 5.3 Validation rules

- Vessel must be selected
- Status must be selected
- Waters must be selected
- If underway: distance must be entered or GPS track must be available
- 12-hour option blocked unless vessel profile has COI two-watch authorisation flagged
- Cannot claim more days in a month than the month contains (e.g. max 28 in February)
- Cannot claim the same calendar day on two different vessels simultaneously — app detects and warns

> Per NMC rules: 1 month = 30 days and 1 year = 360 days for credential calculation purposes. App displays both raw logged days and NMC-equivalent credit.

### 5.4 GPS behaviour

- On dashboard load: `navigator.geolocation.watchPosition()` called silently
- On position acquired: location field auto-fills with coordinates + reverse-geocoded place name
- On underway session: GPS track recorded continuously for distance calculation
- On GPS unavailable: location field left empty, user fills manually — no error message shown
- Privacy: GPS data stored locally only in v1. Not transmitted unless user explicitly exports a track

---

## 6. AIS Log Reconstruction (Premium)

This is the most differentiating feature in the product and the primary conversion point from free to paid. No other maritime logging app uses AIS vessel history to assist log reconstruction. It solves the most acute pain point: a mariner who needs to document a past contract with no contemporaneous records.

### 6.1 What AIS data provides

| Data | How it's used |
|---|---|
| Port calls + timestamps | Determines underway vs. in-port status for each calendar day |
| Voyage legs + coordinates | Determines waters type by cross-referencing with maritime zone boundary polygons (46 CFR Part 7) |
| Distance per leg | Calculates nautical miles run per day |
| Vessel static data | Confirms vessel name, IMO, MMSI, GRT, type — pre-fills vessel profile fields |

### 6.2 User flow

1. User navigates to a past month in Calendar view
2. Taps **"Reconstruct from AIS data"** (greyed out / paywalled on free tier)
3. Inputs vessel name or IMO number + date range
4. App queries MarineTraffic Extended Vessel History API
5. Draft log generated — each day auto-populated with status, location, waters, distance
6. User reviews day-by-day in a swipeable confirmation flow: **Looks right / Edit this day**
7. Confirmed days written to the log. Unmatched days (AIS gap) flagged for manual entry
8. Summary: *"Found and verified X days. Y days need manual entry."*

### 6.3 AIS data limitations and handling

- **Coverage gaps:** smaller vessels, shallow coastal waters, and some flag states have inconsistent AIS. Show *"Partial data: 31 of 68 days matched"* — never frame gaps as failures
- **Position accuracy:** waters classification may be approximate within 2–3 miles of zone boundaries. Flag days in boundary zones for manual review
- **Vessel identity:** MMSI/IMO sometimes incorrect in AIS databases. Offer user ability to confirm vessel identity before accepting data
- **Document integrity:** generated documents note data source as AIS historical records. Captain attestation signature remains the legal validity mechanism

### 6.4 API and cost structure

| Item | Detail |
|---|---|
| Primary provider | MarineTraffic Extended History API |
| Fallback | VesselFinder. BarentsWatch for Norwegian/Arctic waters |
| API cost estimate | ~£0.20–£0.80 per reconstruction request depending on history depth |
| Monetisation model | One-time £4.99 flat fee per vessel/contract (Pro users), OR unlimited reconstructions included in Navigator tier |
| Caching | Cache raw AIS responses for 30 days to avoid duplicate API charges on re-runs or edits |

---

## 7. Document Generation

Document generation is the primary monetisation event. A user who has logged 60+ days of sea service has real career stakes in getting the document right. The paywall at document export is the natural conversion point.

### 7.1 Document types

#### 7.1.1 USCG CG-719S (Small Vessel Sea Service Form)

Auto-fills from stored log data. Only valid for vessels under 200 GRT.

- **Section I:** Applicant information — name, MMC reference number, SSN placeholder (user fills sensitive field), vessel name, official number, GRT, propulsion, waters description
- **Section II:** Monthly day breakdown — auto-populated from calendar log. Totals for Great Lakes, inland (shoreward of boundary), near coastal (seaward of boundary). Average hours per day. Total days. Box 1 = sum of Boxes 2, 3, 4 — validated automatically
- **Section III:** Signature fields — applicant and attesting party (owner/operator/master) pre-filled except actual signatures

> App generates a separate CG-719S automatically for each vessel in the logged period. Common errors caught before export: average hours below 4, days exceeding month length, waters boxes not summing to total, missing official number.

#### 7.1.2 General sea service letter (MCA / USCG officer endorsements)

For vessels over 200 GRT, or as an alternative to CG-719S. Generated on vessel/company letterhead template.

- Auto-populates: vessel name, official number, type, propulsion, tonnage, HP, begin date, end date, days underway, route type breakdown
- For officer endorsements: includes days within past 3 years automatically
- For Tankerman endorsements: includes days within past 5 years
- 12-hour day attestation clause inserted automatically if COI two-watch authorisation is flagged in vessel profile
- Output: PDF with all fillable fields completed. Signature line left blank for captain/employer

#### 7.1.3 Tankerman PIC sea service and transfer letter

Specialised format for Tankerman Person in Charge endorsements (46 CFR 13.127).

- Transfer log table: five loads, five discharges, two commencements and two completions of each, each signed by Tankerman PIC who observed
- App enforces: bunkering, shifting cargo within a vessel, and fuelling are **not** transfers and are blocked from this section
- Cargo type selector: Dangerous Liquids or Liquefied Gas — drives which CFR reference is cited

#### 7.1.4 Qualified instructor letter

For mariners teaching at approved maritime academies.

- Fields: course title, approved course code, dates instructed (within past 5 years)
- Must be on academy letterhead and signed by institution representative — app generates template with placeholder fields

### 7.2 Gmail integration

The document generation flow ends with a one-tap email action. The user should never open a blank compose window.

- After PDF is generated: **"Send to captain"** button appears
- On tap: `mailto:` link opens with pre-filled subject, body text (*"Please find attached my sea service documentation for your signature..."*), PDF attached
- Captain email pre-filled from vessel profile if stored
- iOS: Share Sheet to Mail / Gmail with attachment
- Android: Intent to Gmail with attachment
- Web fallback: download PDF + copy-pasteable email template

> Capturing the captain's email during vessel setup is critical to this flow. Prompt with context: *"Captain's email (for sending documents for signature)"*.

### 7.3 Nautilus / union verification export

- Format: PDF + structured JSON sidecar (vessel, dates, days, waters, hours, position log)
- JSON schema documented publicly to lower the barrier for Nautilus or MCA to build an import connector
- Optional: QR code on PDF links to read-only verification URL (cloud sync tier only)

---

## 8. Tier Structure & Monetisation

### 8.1 Rationale

The yachting industry has a high willingness to pay for convenience relative to consumer apps. Crew spend on sundowners, marina WiFi, and professional development without hesitation. The pain being solved — the end-of-contract documentation scramble — has real career stakes. Pricing should feel like a professional tool, not a consumer subscription.

### 8.2 Tiers

| Tier | Price | Target |
|---|---|---|
| Free | £0 | Crew logging daily, evaluating before committing |
| Pro | £5.99/mo or £49/yr | Officers and serious crew; document export |
| Navigator | £9.99/mo or £79/yr | Applicants for endorsements; AIS reconstruction |
| Captain | £9.99/mo | Captains signing documents, fleet oversight |
| Agency (B2B) | POA | Manning agencies, management companies |

### 8.3 Free tier limits

- Log up to 90 days (one full contract). No expiry on logged data
- Calendar view: full access
- Dashboard: full access
- Document generation: locked — preview visible, export paywalled
- AIS reconstruction: locked — button visible but greyed

> Letting users accumulate data before hitting the paywall is intentional. A user with 60 logged days has real investment and real stakes. The conversion moment is when they tap "Export PDF" for the first time.

### 8.4 Pro tier

All free features plus:

- Unlimited logging
- All four document types: CG-719S, sea service letter, Tankerman letter, instructor letter
- Gmail integration
- Cloud sync and multi-device access
- Retroactive calendar bulk-edit

### 8.5 Navigator tier

All Pro features plus:

- AIS log reconstruction (unlimited)
- Alternatively: AIS reconstruction as a one-time £4.99/vessel/contract add-on for Pro users who need it occasionally
- Multi-contract career timeline with per-vessel GRT breakdown
- Endorsement milestone tracker with projected completion date

### 8.6 Captain tier

- In-app document signing (lightweight DocuSign-equivalent)
- Crew dashboard: see all crew pending document requests
- Fleet vessel registry: manage multiple vessel profiles
- One-tap attestation: review pre-filled document and sign digitally

> Every captain who joins is a distribution channel to their entire current and future crew. Consider: *"Invite your captain — they get their first 3 months free."*

### 8.7 B2B / Agency tier

- Bulk crew licensing (per-seat pricing, volume discount)
- Admin dashboard: all crew sea service records in one view
- Automated end-of-contract document generation triggered on crew departure
- API access for integration with crewing software (SeaCrew, Martide, Crewfo)

---

## 9. Data Architecture & Backend

### 9.1 Data model

| Entity | Key fields |
|---|---|
| `User` | id, name, MMC/CoC number, STCW endorsements[ ], regulatory_framework (MCA\|USCG\|both), tier, created_at |
| `Vessel` | id, user_id, name, official_number, flag, type, propulsion, GRT, HP, coi_two_watch (bool), captain_name, captain_email |
| `LogEntry` | id, user_id, vessel_id, date, status (underway\|anchor\|off_hire), waters (inland\|near_coastal\|offshore\|great_lakes), hours (8\|12), location_text, lat, lng, distance_nm, watchkeeping_hours, watch_type, equipment_used[ ], weather_notes, source (manual\|ais_reconstructed) |
| `Contract` | id, user_id, vessel_id, start_date, end_date (nullable = current), role |
| `Document` | id, user_id, type, generated_at, pdf_url, data_snapshot (JSON), sent_to_email, signed_at |
| `AISReconstruction` | id, user_id, vessel_id, query_start, query_end, api_provider, raw_response (JSON), days_matched, days_unmatched |

### 9.2 Compliance calculation engine

A server-side (or edge function) calculation layer transforms raw `LogEntry` records into credential-relevant metrics.

**Input:** all `LogEntry` records for a user, filtered by date range and vessel.

**NMC mode rules:**
- 1 month = 30 days, 1 year = 360 days
- 12-hour days counted as 1.5 days only if `vessel.coi_two_watch = true`
- Minimum 4 hours for any credit on vessels under 100 GRT

**MCA mode rules:**
- Days and hours as logged
- STCW watchkeeping quality metrics tracked separately (watch hours, equipment used)

**Output object:**
```json
{
  "total_days": 312,
  "days_past_3_years": 180,
  "days_past_5_years": 280,
  "days_by_waters": {
    "inland": 45,
    "near_coastal": 220,
    "offshore": 47,
    "great_lakes": 0
  },
  "total_hours": 2496,
  "watch_hours": 1440,
  "days_by_vessel": [
    { "vessel_id": "abc", "name": "S/Y Perseverance", "days": 180, "start": "2024-01-01", "end": "2024-06-30" }
  ]
}
```

> This output is the single source of truth for all document generation. Documents never re-compute — they read from this object.

### 9.3 Storage strategy

#### v1 — Local first

- `localStorage`: `lastVessel` (string), `vessels` (JSON array), `logEntries` (JSON array)
- All state managed in-memory during session. Persisted on every log action
- No backend required. Offline-capable by default
- Limitation: no multi-device sync, data loss risk if browser storage is cleared

#### v2 — Cloud sync (Pro tier)

- **Backend:** Supabase (Postgres + Auth + Storage) or PocketBase for self-hostable option
- **Auth:** magic link / Google OAuth. No passwords
- **Sync:** optimistic local-first writes. Queue sync requests when offline. Conflict resolution: last-write-wins with server timestamp; manual merge prompt on detected conflict
- **PDF storage:** generated PDFs in S3-compatible object storage. Signed URL with expiry for captain sharing
- **Offline:** service worker queues log entries when offline, syncs on reconnect. Critical for vessels at sea

### 9.4 Security and privacy

- SSN / MMC numbers: never stored server-side in plain text. Encrypted at rest. User fills sensitive fields in the PDF generation flow only — not stored in `LogEntry`
- GPS data: stored locally only in v1. In v2, lat/lng stored server-side but never exposed to third parties
- AIS API keys: server-side only, never exposed to client
- Document PDFs: access controlled by signed URL. Captain email links expire after 30 days
- GDPR / UK DPA 2018 compliance: full data export and deletion available on user request

### 9.5 API endpoints (v2)

| Endpoint | Purpose |
|---|---|
| `POST /auth/magic-link` | Initiate passwordless auth |
| `GET / POST /vessels` | List or create vessel profiles |
| `GET / PATCH / DELETE /vessels/:id` | Vessel profile management |
| `GET / POST /log-entries` | Fetch or create log entries. Supports date-range filter |
| `PATCH /log-entries/:id` | Edit a log entry (retroactive correction) |
| `POST /log-entries/bulk` | Bulk create for AIS reconstruction flow |
| `GET /compliance/summary` | Computed metrics (days, hours, waters breakdown, 3yr/5yr) |
| `POST /documents/generate` | Trigger PDF generation. Returns job ID |
| `GET /documents/:id` | Poll generation status. Returns signed PDF URL |
| `POST /ais/reconstruct` | Trigger AIS query. Returns reconstruction job ID |
| `GET /ais/reconstruct/:id` | Poll AIS job. Returns draft log entries for user review |

---

## 10. Growth Strategy & Industry Adoption

### 10.1 The captain mandate mechanism

The fastest path to industry-standard status runs through captains, not crew. A captain who adopts the app and requires their crew to use it is worth hundreds of organic sign-ups.

- Captain tier in-app signing removes the main friction from the captain's side: they receive a complete, accurate, pre-filled document rather than a vague request to "write me a sea service letter"
- **Incentive:** *"Invite your captain — they get their first 3 months free"*. The captain's experience is reviewing and signing a professional document — a positive, low-effort interaction
- Fleet view for captains: see all current crew members, which documents are pending signature, one-tap approval flow. This has direct value to the captain independently of helping crew

### 10.2 Maritime academy channel

Students preparing for their first OOW CoC or MMC are exactly the users who need to aggregate sea service from multiple training voyages.

- Offer free Navigator tier to maritime academy students with verified institution email
- Approach academies with a white-label or co-branded version as a student tool
- Instructors using the app for Qualified Instructor Letter documentation become internal advocates

### 10.3 Agency / B2B channel

Manning agencies spend staff time chasing mariners for sea service letters, fixing form errors, and following up on unsigned documents. The pitch is time saved in admin.

- Target: agencies managing 20+ crew. A bulk licence that eliminates 10 hours of admin per month per crew change is an easy sell
- API access pitch: integrate with SeaCrew, Martide, or Crewfo to eliminate duplicate data entry

### 10.4 AIS reconstruction as PR / virality

The AIS reconstruction feature is inherently shareable in maritime circles. *"App reconstructs your lost sea service log from satellite data"* is a compelling story for Splash247, Nautilus International newsletter, and maritime LinkedIn.

- Demo video: enter a vessel name and watch a year of log entries populate in real time
- First reconstruction free (loss-leader). User shares the result

### 10.5 Verification partnership

The long-term moat is a data verification partnership with Nautilus International or directly with the MCA/NMC.

- Approach Nautilus International with a data-sharing proposal: mariners authorise records to be shared directly from the app to their union profile
- Document the JSON export schema publicly. Lower the barrier for the MCA to build an import connector
- Seek informal MCA "approved tool" status — not a regulatory requirement but a significant trust signal

---

## 11. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (v1). React or SvelteKit for v2. No build tools required for v1 |
| Styling | CSS custom properties. Light/dark mode via `prefers-color-scheme`. Monospace throughout. No CSS framework — bespoke |
| Storage v1 | `localStorage`. Vessels + log entries as JSON arrays. ~50KB typical annual data footprint |
| Storage v2 | Supabase (Postgres + Auth + Storage). Row-level security per user. Encrypted sensitive fields |
| PDF generation | `pdf-lib` (client-side, no server needed for v1). Puppeteer/headless Chrome on server for v2 (proper CG-719S form field support) |
| AIS data | MarineTraffic Extended History API (primary). VesselFinder fallback. Server-side proxy only — API keys never exposed to client |
| Zone classification | GeoJSON boundaries for 46 CFR Part 7 inland/near-coastal zones. Turf.js for point-in-polygon classification. Static asset (~2MB), no map tiles needed |
| Email integration | `mailto:` deep links for v1. Optional SendGrid integration in v2 for delivery confirmation |
| Auth | Supabase Auth. Magic link + Google OAuth. No passwords |
| Hosting | Vercel or Cloudflare Pages. Edge functions for compliance calculation and AIS proxy |
| Monitoring | Sentry (errors). PostHog (product analytics — privacy-respecting, self-hostable) |

---

## 12. Development Roadmap

### v1.0 — Core logging (MVP)

- [ ] Dashboard with Log button, day counter, vessel chip
- [ ] Bottom-sheet log entry: status, waters, hours, location (GPS + manual)
- [ ] Calendar view with retroactive single-day editing
- [ ] Vessel profile setup and localStorage persistence
- [ ] Watchkeeping section (Settings-gated, collapsed by default)
- [ ] Dark / light mode (system preference)
- [ ] PWA manifest + service worker for offline use

### v1.5 — Document generation

- [ ] CG-719S auto-fill PDF export
- [ ] General sea service letter PDF export
- [ ] Gmail integration (mailto: deep link with PDF)
- [ ] Free tier paywall at export
- [ ] Stripe payment integration

### v2.0 — Cloud and captain tier

- [ ] Supabase backend. User accounts. Cloud sync
- [ ] Captain tier: in-app document signing flow
- [ ] Fleet view for captains
- [ ] Multi-device sync
- [ ] Offline queue + reconnect sync
- [ ] Calendar multi-select bulk edit

### v2.5 — AIS reconstruction

- [ ] MarineTraffic API integration (server-side proxy)
- [ ] Reconstruction flow: vessel search → date range → review → confirm
- [ ] Navigator tier launch
- [ ] Per-reconstruction purchase option for Pro users

### v3.0 — B2B and ecosystem

- [ ] Agency admin dashboard
- [ ] Bulk crew licensing and seat management
- [ ] Public API for crewing software integrations
- [ ] Nautilus International data-sharing integration
- [ ] Endorsement milestone tracker with projected completion dates

---

## 13. Regulatory Compliance Checklist

Fields the app must collect and validate to produce rejection-proof documents per NMC/MCA requirements:

| Requirement | How the app handles it |
|---|---|
| Official vessel number / state reg | Field required in vessel setup. Format-validated where possible. Fabricated numbers flagged |
| GRT or vessel dimensions | Required for tonnage-limited endorsements. GRT estimated from L×B×D if direct value unknown |
| Route water type per day | Inland / near coastal / Great Lakes / offshore. Drives CG-719S box totals. Forced on every log entry |
| Average hours per day | 4-hour minimum enforced. 12-hour option locked unless COI two-watch confirmed |
| Days per vessel (separate form) | App generates one CG-719S per vessel automatically — cannot be combined |
| 3-year day breakdown | Always computed. Required for officer endorsement letters |
| 5-year day breakdown | Always computed. Required for Tankerman and renewal letters |
| Propulsion type | Required in vessel profile for auxiliary sail endorsement eligibility |
| Transfer records for Tankerman | 5 loads, 5 discharges, 2 commencements/completions each. Signed per transfer by Tankerman PIC |
| Attesting party (not the applicant) | App clearly separates applicant signature from attesting party field. Cannot be same person |
| Sea service never expires | All historical records retained permanently. No archiving or auto-deletion |
| Month/year day limits | Cannot log more days in a month than the month contains. Cross-vessel duplicate days blocked |

> **Disclaimer included on all generated documents:** *"This document was generated by Sea Service Logger as an aid to credential application. It is not a formal evaluation or a guarantee of how sea service will be credited by the relevant authority. The attesting signature of the master, owner, or authorised officer remains the legal certification of this record."*

---

*Sea Service Logger · Product Specification v2.0 · Confidential*
