# Relic — Technical Requirements (TRD)

Last updated: 2026-10-30. Versions are the latest stable on npm as of this date. Expo-managed packages are pinned by `npx expo install` to the SDK 58 set.

## 1. Platform
| Item | Choice |
|---|---|
| Target | Android (Play Store). Code stays cross-platform; iOS is neither built nor verified in v1. |
| Package ID | `app.yousuf.relic` |
| Framework | Expo SDK **58** (`expo@58.0.21`), React Native **0.88**, React **19.3** |
| Native | Dev build with Continuous Native Generation (`expo prebuild`) and config plugins. Expo Go is not supported. |
| Build | Local Gradle via `npx expo run:android` / `./gradlew bundleRelease`. Android SDK installed in `~/Android` (cmdline-tools, platform, build-tools, NDK, CMake). No emulator. |
| Device | User's phone over USB `adb`. Screenshots via `adb exec-out screencap`. |
| Language | TypeScript (strict), English only, i18n-ready. |
| Node | v24 LTS (local). |

## 2. App libraries
| Concern | Package | Version |
|---|---|---|
| Routing | expo-router | 58.x |
| Animation | react-native-reanimated / react-native-worklets | 4.7.x |
| Gestures | react-native-gesture-handler | 3.4.x |
| GPU drawing (Vault, grain, glows, share card) | @shopify/react-native-skia | 2.14.x |
| Server state / cache | @tanstack/react-query | 5.105.x |
| Client state | zustand | 5.0.x |
| Data API client (PostgREST) | @supabase/postgrest-js | 2.118.x |
| Session token storage | expo-secure-store | 58.x |
| Images: pick / resize / display | expo-image-picker, expo-image-manipulator, expo-image | 58.x |
| Voice record / play | expo-audio | 58.x |
| Speech to text (on-device, no AI) | expo-speech-recognition (Android `SpeechRecognizer`, `requiresOnDeviceRecognition` when available) | 58.0.x |
| Location | expo-location | 58.x |
| App lock | expo-local-authentication | 58.x |
| Notifications (local only) | expo-notifications | 58.x |
| Widgets | react-native-android-widget (Expo config plugin) | 0.26.x |
| Share card | react-native-view-shot + expo-sharing | 6.2.x / 58.x |
| Haptics | expo-haptics | 58.x |
| Fonts | expo-font with bundled OFL fonts: IM Fell DW Pica, Newsreader, IBM Plex Mono | 58.x |
| i18n | i18next + react-i18next + expo-localization | 26.x / 17.x / 58.x |
| Google sign-in (native) | @react-native-google-signin/google-signin | 17.x |
| SVG icons | react-native-svg | 15.16.x |

## 3. Backend: Neon (project `muddy-haze-64769141`, aws-ap-southeast-1)
`neon.ts` declares every service. Branches: `production`, plus `dev` for development; temporary branches get a 7-day TTL.

### 3.1 Auth: Neon Managed Better Auth
- **Spike result (2026-10-30, branch `spike-auth`)**: the SDK `@neondatabase/auth@0.7.0-beta` is browser/Next-oriented (cookie and iframe flows) and has no React Native entry point. Raw HTTP against the Managed Auth URL **works without a browser**:
  - `POST {NEON_AUTH_BASE_URL}/sign-up/email` and `/sign-in/email` return a session token and a `__Secure-neon-auth.session_token` cookie. An `Origin` header is **required**. `http://localhost:*` is pre-trusted; the custom scheme `relic://` is rejected (`INVALID_ORIGIN`). The app sends the trusted origin `https://yousuf-git.github.io`, registered with `neon neon-auth domain add`.
  - `GET /get-session` works when the cookie is sent manually as a `Cookie` header. A bearer header does **not** work.
  - `GET /token` returns an EdDSA JWT (15 minutes; claims `sub`, `role=authenticated`, `iss`, `aud`).
- **App design**: a thin `authClient` over `fetch`. The session token is stored in SecureStore and the JWT is cached in memory, refreshed at 12 minutes and on a 401. The client never stores passwords. Sign-out calls `/sign-out` and wipes SecureStore.
- **Google**: native Google sign-in (Credential Manager) returns an ID token, which goes to `POST /sign-in/social {provider:"google", idToken:{token}}`. This needs the user's own Google OAuth Web and Android clients configured in Neon Auth. **Not yet verified**: whether Managed Auth accepts ID-token sign-in. If it doesn't, the fallback is an `expo-web-browser` OAuth flow through a trusted HTTPS callback page that deep-links back into the app.
- **Email**: Managed Auth sends verification and password-reset email. Production uses **custom SMTP on Resend** (`smtp.resend.com`); the key goes into the Neon Auth config, never into the app.

### 3.2 Data access: Neon Data API + RLS
- The app sends Data API (PostgREST) requests with `Authorization: Bearer <JWT>`. **Every table has RLS enabled** with policies on `auth.user_id()`. Nothing is granted to `anon`.
- Business rules are enforced in Postgres, not the UI:
  - **Daily cap**: a `BEFORE INSERT` trigger on `memories` allows at most 5 per user per local day when `plan = 'free'`.
  - **Storage quota**: `media.size_bytes` sums to at most 500 MB per free user. This is checked at presign time and re-checked at confirm time against the object's real size (`HeadObject`).
  - **Limits**: at most 5 photos per memory and voice of at most 60 s (checked constraints plus a trigger).
- The schema lives in `db/migrations/*.sql` with RLS tests in `db/tests` (pgTAP-style SQL run against a branch).

### 3.3 Functions (anything that needs a secret)
| Function | Purpose |
|---|---|
| `vault` `/media` | `POST /sign-upload` (quota check, then a presigned PUT, a key under `u/<uid>/…`, and a pending media row); `POST /confirm` (HeadObject to get the real size and content type, then marks the row ready); `POST /sign-read` (batch presigned GETs, 1-hour expiry) |
| `vault` `/account` | `POST /export` (ZIP manifest); `POST /delete` (removes the user's objects, rows and auth user; also called from the web deletion page) |
| `vault` `/cron/purge` | Nightly trigger: hard-delete relics released over 30 days ago and stale pending uploads |

Each function verifies the JWT with `jose` against the injected `NEON_AUTH_JWKS_URL` and the issuer, and uses the pooled `DATABASE_URL`. The placeholder `hello` function is removed.

### 3.4 Object storage
- Bucket `media` (private). Keys: `u/<userId>/<memoryId>/<uuid>.{webp|m4a}`. Images are 1600 px on the long edge as WebP (q≈0.8) before upload. Voice is AAC m4a, at most 60 s. Video is stored as **links only**.

## 4. Client architecture
```
app/                 expo-router routes: (onboarding) (auth) (vault) relic/[id] preserve ledger quarters
src/features/*       vault, preserve, relic, ledger, share, notifications, widgets, lock, account
src/lib/             auth-client, data-api, media, calendar-source (interface + in-app impl), i18n
src/design/          tokens, motion system, typography, icons, shaders
db/                  migrations, rls tests, seed (dev only)
functions/           media, account, waitlist
site/                GitHub Pages: privacy policy, account deletion, terms
```
- Calendar sits behind a `CalendarSource` interface. v1 implements `InAppCalendarSource`; `DeviceCalendarSource` (expo-calendar) can be added later without touching any UI.
- Offline: React Query persisted cache for reads. Writes need a connection and show a calm "waiting for signal" state.

## 5. Security checklist
- RLS on every table; no service keys or DB strings in the app; only `EXPO_PUBLIC_NEON_AUTH_URL`, `EXPO_PUBLIC_DATA_API_URL` and `EXPO_PUBLIC_FUNCTIONS_*` are public.
- Session token in SecureStore, JWT in memory only.
- Private bucket, presigned URLs that expire, and keys scoped by user ID and checked by the function.
- `.env*` is git-ignored. The release keystore lives outside the repo (`~/.relic-keys/`).

## 6. Release
- Play App Signing with a local upload keystore. AAB from `bundleRelease`.
- Play Data Safety: email, name, photos, audio, approximate/precise location (optional), user content. All encrypted in transit; deletion available both in the app and on the web.
