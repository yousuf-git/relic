# Relic v1 — Build Plan

Agents tick each box as soon as the item is built **and verified**. Legend: `[ ]` todo · `[x]` done · `[~]` blocked (reason inline).
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
- [ ] Tokens, typography (bundled OFL fonts), motion system, haptics map
- [ ] Contrast check of palette (WCAG AA)
- [ ] Custom icon set (SVG)
- [ ] Duck hero assets (cursor-agent): icon, splash, onboarding, empty states, ageing stages, seal sequence frames
- [ ] Vessel art: letter, glass plate, echo shell, map shard, locket, reel canister; stone/paper textures
- [ ] Skia grain + lamp-glow primitives

## Phase 4 — Auth, onboarding, lock
- [ ] Auth client (SecureStore session, JWT refresh) + email sign-up/in/reset/verify
- [~] Google sign-in (waiting: OAuth client IDs from user after SHA-1 handoff)
- [ ] The Descent onboarding
- [ ] Vault door: biometric/PIN lock

## Phase 5 — Preserve ritual (capture)
- [ ] Words + live speech-to-text
- [ ] Photos (≤5, resized 1600 px, upload with progress)
- [ ] Voice (≤60 s, waveform)
- [ ] Place, people, weight, mood light, video links
- [ ] Seal hold + duck-dispense animation + descent into Vault
- [ ] Edit (reopen seal), release with undo (soft delete)
- [ ] Limit states: daily cap seals, quota gauge, friendly blocks

## Phase 6 — Vault & relic view
- [ ] Vault shaft (levels = months), niches, lamps, parallax, lift peek
- [ ] Relic view with per-vessel reveal + catalog card
- [ ] Filters: person, place, mood, vessel; text search
- [ ] Empty / loading / error / offline states

## Phase 7 — Ledger, unearthing, sharing
- [ ] Ledger year-of-lamps + month + day (CalendarSource interface)
- [ ] Unearthing daily card (on this day / resurfaced relic)
- [ ] Share cards (Plate + Letter), export via share sheet

## Phase 7b — Approved extras
- [ ] Sealed relics (time-locked until date; enforced server-side)
- [ ] Keeper's prompts (daily rotating prompt; feeds notifications + widget)
- [ ] Constellations (threads by person/place)
- [ ] Vault export (ZIP of JSON + media via `account` function)

## Phase 8 — Notifications & widgets
- [ ] Local notifications: on this day, anniversaries, gentle nudges, user reminders; settings
- [ ] Widgets: relic of the day, on this day, quick capture, flame/vault stats

## Phase 9 — Keeper's quarters & legal
- [ ] Settings: reminders, lock, plan + quota gauge, premium waitlist, export, delete account
- [ ] GitHub Pages `site/`: privacy policy, account deletion, terms (contact email placeholder)

## Phase 10 — Release
- [ ] QA pass on device (all flows, a11y, reduce-motion)
- [ ] Upload keystore + release AAB builds
- [ ] Store listing copy, feature graphic, icon 512
- [ ] Device screenshots (phone) → README
- [ ] README complete; final push
- [~] Pre-publish TODOs for user: contact email, Resend API key + SMTP, Play Console upload
