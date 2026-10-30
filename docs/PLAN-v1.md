# Relic v1 — Build Plan

Agents tick each box as soon as the item is built **and verified**. Legend: `[ ]` todo · `[x]` done · `[~]` blocked (reason inline) · `[d]` built, typechecks and bundles, awaiting on-device verification.
Related docs: [DESIGN.md](DESIGN.md), [TRD.md](TRD.md).

## Phase 0 — Scoping & direction
- [x] Scoping Q&A with user (2026-10-30)
- [x] Neon project linked (`neon init`), Managed Auth active
- [x] Auth spike: RN-compatible raw-HTTP flow proven (sign-up → cookie session → JWT)
- [x] Research: Silo relics, memory/keepsake psychology
- [x] DESIGN.md, TRD.md, PLAN-v1.md drafted
- [x] **Checkpoint 1: design direction approved; PEZ-like stem kept; all 4 extras in v1**

## Phase 1 — Foundations
- [x] git init, push docs to `main` (via git:push skill)
- [x] Android SDK (cmdline-tools, platform-tools, NDK via Gradle) in `~/Android/Sdk`
- [x] Expo SDK 58 app scaffold (TS strict, expo-router), lint + typecheck scripts (expo 58.0.21 / RN 0.88.1; project `.npmrc` overrides the 21-day release-age rule, approved by user)
- [ ] Dev build installs and launches on user's phone via adb
- [x] Neon `dev` branch; `neon.ts`: `hello` removed, `media` bucket, Data API on (`spike-auth` left to expire 2026-11-06)
- [ ] Trusted auth origin registered

## Phase 2 — Data layer & backend
- [x] Migrations: profiles, memories, media, people, memory_people, links, waitlist (places inline on memories; reminders in `profiles.notification_prefs`)
- [x] RLS on every table + RLS tests pass (user A cannot read/write user B) — `db/tests/rls.test.mjs` 8/8
- [x] Triggers: 5/day free cap, 5 photos/memory, 1 voice ≤ 60 s (quota enforced in `media` function)
- [x] Data API enabled with Neon Auth JWT; verified with real token
- [x] Function `vault` /media (sign-upload with quota lock, confirm, sign-read, delete) + JWT verification — `db/tests/vault.test.mjs`
- [x] `vault` /account (export ZIP, delete) + nightly purge trigger; waitlist is a plain RLS table

## Phase 3 — Design system & assets
- [x] Tokens, typography (bundled OFL fonts), motion system, haptics map
- [x] Contrast check of palette (WCAG AA) — all text pairs ≥ 5.5:1; `faint` (4.05:1) large/decorative only
- [x] Custom icon set (SVG, `src/ui/Icon.tsx`)
- [x] Duck hero assets (cursor-agent): icon, adaptive icon + monochrome, splash, hero, niche, 3 ageing stages, tilt/dispense frame
- [x] Vessel art: letter, glass plate, echo shell, map shard, locket, reel canister, wax seal; stone/paper textures; scenes; share backdrops
- [x] Skia grain + lamp-glow primitives

## Phase 4 — Auth, onboarding, lock
- [d] Auth client (SecureStore session, JWT refresh) + email sign-up/in/reset/verify
- [~] Google sign-in (waiting: OAuth client IDs from user after SHA-1 handoff)
- [d] The Descent onboarding
- [d] Vault door: biometric/PIN lock

## Phase 5 — Preserve ritual (capture)
- [d] Words + live speech-to-text
- [d] Photos (≤5, resized 1600 px, upload with progress)
- [d] Voice (≤60 s, waveform)
- [d] Place, people, weight, mood light, video links
- [d] Seal hold + duck-dispense animation + descent into Vault
- [d] Edit (reopen seal), release with undo (soft delete)
- [d] Limit states: daily cap seals, quota gauge, friendly blocks

## Phase 6 — Vault & relic view
- [d] Vault shaft (levels = months), niches, lamps, parallax, lift peek
- [d] Relic view with per-vessel reveal + catalog card
- [d] Filters: person, place, mood, vessel; text search
- [d] Empty / loading / error / offline states

## Phase 7 — Ledger, unearthing, sharing
- [d] Ledger year-of-lamps + month + day (CalendarSource interface)
- [d] Unearthing daily card (on this day / resurfaced relic)
- [d] Share cards (Plate + Letter), export via share sheet

## Phase 7b — Approved extras
- [d] Sealed relics (time-locked; media signing refused server-side until the date)
- [d] Keeper's prompts (daily rotating prompt; feeds notifications + widget)
- [d] Constellations (threads by person/place)
- [d] Vault export (ZIP of JSON + media via `account` function)

## Phase 8 — Notifications & widgets
- [d] Local notifications: on this day, anniversaries, gentle nudges, user reminders; settings
- [d] Widgets: relic of the day, on this day, quick capture, flame/vault stats

## Phase 9 — Keeper's quarters & legal
- [d] Settings: reminders, lock, plan + quota gauge, premium waitlist, export, delete account
- [x] GitHub Pages `site/`: privacy policy, account deletion, terms (contact email placeholder)

## Phase 10 — Release
- [ ] QA pass on device (all flows, a11y, reduce-motion)
- [d] Upload keystore (`~/.relic-keys` + signing plugin) — release AAB pending
- [d] Store listing copy (`docs/store-listing.md`), feature graphic base, icon 512 — title overlay pending
- [ ] Device screenshots (phone) → README
- [ ] README complete; final push
- [~] Pre-publish TODOs for user: contact email, Resend API key + SMTP, Play Console upload
