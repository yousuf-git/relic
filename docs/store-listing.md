# Relic: Google Play listing

Draft for the Play Console. Last updated 2026-10-31. Every claim below is a feature in the app or a statement in the published privacy policy (`site/privacy.html`). If either changes, change this file too.

Placeholders to replace before submission: `CONTACT_EMAIL_TBD`, the screenshot files, the Play Store URL on the website.

## 1. Store listing

### App name (max 30)

```
Relic: Private Memory Vault
```
27 characters. No ranking words, no "free", no emoji, as Play's metadata policy asks.

### Short description (max 80)

```
Keep memories as objects in a private vault. No ads, no tracking, full export.
```


### Full description (max 4000)

```
Up there, everything is forgotten. Down here, what you keep, remains.

Relic is a private vault for your memories. Each one becomes a relic: a folded letter for your words, a glass plate for your photos, an echo shell for your voice. You are the Keeper, and the vault is a shaft lit by lamps. Every month is a level. The further back a memory sits, the deeper it goes.

NOT A FORM. A RITUAL.
Choose what's in your hand: words, a voice, or photos. Hold the mic and speak, and your words write themselves into the letter. Then add when it happened, where, and who was there, one question at a time. Drag the relic between a feather and a stone to say how much it weighs. Press and hold the wax seal, and it drops into the vault.

WHAT A RELIC CAN HOLD
- Words, up to 10,000 characters
- Up to five photos
- One voice recording, up to a minute
- A place, by name, with a pin if you choose to tag it
- The people who were there
- A link to a video, kept as a link (Relic doesn't store video files)

COMING BACK TO IT
- The Vault: scroll down through time. Relics sit in lit niches, larger and brighter the more they weigh.
- The Ledger: a whole year as a wall of tiny lamps, one for every day. Tap a day to open what you kept on it.
- Unearth: Relic can raise a relic from a past year on the day it happened.
- Sealed relics: lock a relic until a date you choose, a letter to whoever you are by then.
- Share card: a 4:5 picture of a relic on stone or paper, made on your phone. It goes where you send it and nowhere else.
- Widgets: put a relic on your home screen.

THE DUCK
A rubber duck on a worn teal stem keeps you company. It starts clean. At 30 relics it gathers patina. At 365 it looks like it has been down here a while. There is no streak to protect and nothing to lose. It only ever ages.

YOURS, PROPERLY
- No ads. No analytics or tracking SDKs. Nothing sold. Your memories are not processed by AI.
- Vault door: lock Relic with your fingerprint, face or screen lock.
- Export the whole vault as a ZIP: readable JSON plus your original photos and voice recordings.
- Release a relic and you have 30 days to undo it. Release the vault and your account and everything in it is deleted permanently, from inside the app.
- Reminders are optional, off until you turn them on, and scheduled on your phone.

THE FREE VAULT
5 new relics a day and 500 MB of photos and voice. Words take almost no space. A larger premium vault is planned; it isn't for sale yet.

HONEST LIMITS
- Relic needs a connection to save a relic.
- It is not end-to-end encrypted. Your relics are stored on servers in Singapore, and we don't read them.
- Dictation uses Android's speech service. If your phone can't do it on the device, Android may send the audio to Google to turn it into text. Relic never receives or stores that audio.
- Android only, for now.

Privacy policy: https://yousuf-git.github.io/relic/privacy.html
```

Notes on the copy:
- Plain text: Play shows line breaks and hyphen lists as written. Capitals are limited to section labels, which Play allows.
- Nothing here claims a feature the app does not have. Constellations (threads by person or place) are in DESIGN.md but are deliberately not mentioned.
- "Singapore" and "not end-to-end encrypted" are stated on purpose. They match the privacy policy and cost less trust than being found out later.

### What's new, version 1.0.0 (max 500)

```
First release. Preserve a memory as a relic, hold the wax seal, and watch it drop into your vault. Browse by month in the Vault, by day in the Ledger, and let Unearth raise something from a past year. Export everything or release your vault whenever you like.
```

### Category and tags

- **App category**: Lifestyle. Productivity is the runner-up, but Lifestyle is where people look for journals and keepsakes.
- **Type**: App.
- **Tags** (Play lets you pick up to 5 from its own list, and the available names vary, so choose the closest): Journal or Diary, Memories, Notes, Photo journal, Personal organizer. Drop any that are missing from the picker. Do not add tags that describe features Relic lacks (cloud backup for photos in general, social, AI).

### Contact details and URLs

| Field | Value |
|---|---|
| Website | https://yousuf-git.github.io/relic/ |
| Email | `CONTACT_EMAIL_TBD` |
| Privacy policy | https://yousuf-git.github.io/relic/privacy.html |
| Account deletion URL (Data safety) | https://yousuf-git.github.io/relic/delete-account.html |
| Terms (optional field in listing) | https://yousuf-git.github.io/relic/terms.html |

### Graphics

- **App icon**: `assets/store/icon-512.png` (512 x 512).
- **Feature graphic** (1024 x 500): build from `assets/store/feature-graphic-base.png`. Overlay line, in IM Fell DW Pica italic: *Down here, what you keep, remains.*
- **Phone screenshots**: 8, in the order and with the captions below.

## 2. Screenshot captions (headline max 30 characters)

Shoot on a real phone with realistic content, not lorem ipsum: a vault with about 20 relics across several months, in different vessels.

| # | Screen | Headline | What to show |
|---|---|---|---|
| 1 | Vault | Every month is a level | The shaft mid-scroll: lit niches at uneven depths, the depth gauge on the edge reading a level and month. |
| 2 | Relic view | Open it the way you kept it | A glass plate relic with its catalog card (number, date, level, place, people) in monospace. |
| 3 | Preserve ritual | What's in your hand? | The first step: words, voice or photo, with the letter forming. |
| 4 | Seal moment | Press and hold to seal | The wax seal with its progress ring about two thirds full. |
| 5 | Ledger | A year of tiny lamps | The year wall, brighter where more was kept. |
| 6 | Unearth | Something surfaces today | The daily card, "A relic surfaced from Level 31". |
| 7 | Share card | Share the card, not the vault | A 4:5 share card on stone or paper, with the "kept in Relic" mark. |
| 8 | Widgets | A relic on your home screen | The home screen with the widget beside the launcher icons. |

Order logic: screenshots 1 to 3 appear in search results, so they carry the place, the object and the ritual. The seal moment is the emotional peak, so it comes right after. The home-screen widget closes the set because it is what the keeper sees most days.

## 3. Content rating (IARC questionnaire)

- **Category**: choose "Utility, productivity, communication, or other" (a journal and keepsake app).
- Violence, sexual content, profanity, controlled substances, gambling, horror: **No** to all. Relic ships no content of its own beyond the app's art.
- **User-generated content / sharing**: the vault is private. Users cannot see each other's content, there is no feed, no comments and no messaging. The share card is an image the user sends through Android's share sheet. Answer "users cannot interact or share content with each other in the app". If the questionnaire asks specifically about sharing, say sharing is user-initiated through the OS.
- **Shares the user's location with other users**: No. Location is stored only on the user's own relic.
- **Digital purchases**: No. Premium is not on sale.
- **Unrestricted internet access / web browsing**: No. Links open the system browser.
- Expected result: **Everyone** (ESRB), **PEGI 3**, with the exact outcome depending on the answers above.
- **Target audience**: select 13+ bands only (13 to 15, 16 to 17, 18+). The terms and privacy policy say users must be 13 or older. Selecting any under-13 band would bring in Play's Families policy, which Relic is not built for.
- **Ads**: "Contains ads" = **No**.
- **Advertising ID**: declare that the app does **not** use it. Check that the release manifest has no `com.google.android.gms.permission.AD_ID`.

## 4. Data safety form

Answers match `site/privacy.html`. Relic has no analytics, advertising or crash-reporting SDK, and nothing is shared with third parties other than service providers that process data on Relic's behalf (Neon for database, sign-in and storage; Resend for sign-in email). Play does not treat that as "sharing".

### Overview questions

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | Yes, it collects. |
| Is all of the user data collected by your app encrypted in transit? | Yes (HTTPS everywhere). |
| Do you provide a way for users to request that their data is deleted? | Yes. |
| Account deletion URL | https://yousuf-git.github.io/relic/delete-account.html |
| In-app deletion | Quarters, then Release the vault. Also available: delete a relic individually, and delete data without deleting the account. |
| Data shared with third parties? | No data types are marked as shared. |
| Independent security review | No. |
| Committed to Play Families policy | No (not a children's app). |

### Data types collected

All collected data is processed and stored on Neon infrastructure (AWS ap-southeast-1) for **App functionality**. Name, email and user ID are also for **Account management**. None is used for analytics, advertising, personalisation or fraud prevention. None is collected ephemerally: it is stored until the user deletes it.

| Category | Data type | Collected | Shared | Required or optional | Purposes |
|---|---|---|---|---|---|
| Personal info | Name | Yes | No | Required (given at sign-up; editable) | App functionality, Account management |
| Personal info | Email address | Yes | No | Required | App functionality, Account management |
| Personal info | User IDs | Yes (internal account ID) | No | Required | App functionality, Account management |
| Location | Approximate location | Yes | No | Optional (only when the user tags a place) | App functionality |
| Location | Precise location | Yes | No | Optional (only when the user tags a place) | App functionality |
| Photos and videos | Photos | Yes | No | Optional | App functionality |
| Audio files | Voice or sound recordings | Yes (voice relics) | No | Optional | App functionality |
| App activity | Other user-generated content (memory text, titles, people's names, video links) | Yes | No | Required for the app's core purpose; the user chooses what to write | App functionality |

### Data types not collected

Health and fitness, Financial info, Messages, Videos (links are stored, not video files), Files and docs, Calendar, Contacts, Web browsing, App interactions, In-app search history, Installed apps, Crash logs, Diagnostics, Other app performance data, Device or other IDs, Address, Phone number, Race and ethnicity, Political or religious beliefs, Sexual orientation, Other personal info, Music files, Other audio files.

### Judgment calls to confirm before submitting

1. **Dictation audio.** Hold-to-speak uses Android's `SpeechRecognizer`, which may send audio to Google's service when on-device recognition is unavailable. The app never receives that audio, only the resulting text, so it is not declared as collected. The privacy policy discloses it in plain words. If you prefer to be conservative, also tick "Voice or sound recordings: shared with Google, for App functionality", and accept that the form will then show a share.
2. **IP addresses in routine server logs.** Neon and AWS keep ordinary request logs. Play's guidance on these is not explicit, and Relic does not read or use them, so no data type is ticked. The privacy policy states it.
3. **User-generated content** is placed under App activity, "Other user-generated content", which is where Play lists text a user creates in an app.

## 5. App access and review notes

- **App access**: all of the app is behind sign-in. Select "All or some functionality is restricted" and give reviewers a working test account (email and password) with a few relics already in the vault. Create it on production before submitting. Do not put the password in the repo.
- **Review note** to paste: "Relic is a private journal. Sign in with the test account provided. Microphone is used for voice recordings and dictation, location only when the user tags a place, biometrics only for the optional vault door. There are no ads, no purchases and no social features. Account deletion: Quarters, then Release the vault."

## 6. Pre-submission checks

These come from reading the repo, not from running a release build, so verify them on the actual AAB.

- **Foreground service permissions.** `android/app/src/main/AndroidManifest.xml` declares `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (from `expo-audio`). Play requires a Foreground service declaration, with a video, for media-playback foreground services. Relic plays a 60-second relic in the foreground only. Unless you add background playback, block both permissions with `android.blockedPermissions` in `app.json` to skip that review step.
- **`SYSTEM_ALERT_WINDOW`** is in the manifest (default from the Expo template, used by the dev client). The app does not draw over other apps. Block it in `app.json` for release.
- **`MODIFY_AUDIO_SETTINGS`** is harmless but unused by any feature described here. Fine to leave.
- **Trademark and IP.** The duck art carries PEZ-like embossing on the stem. This was a deliberate decision on 2026-10-30, accepting the risk. Play's Intellectual Property and Impersonation policies are where a takedown would come from. The listing never uses the name "PEZ" and never refers to the show the premise nods to.
- **Placeholders.** The listing, the three site pages and the footer all contain `CONTACT_EMAIL_TBD`. Replace it everywhere (`grep -r CONTACT_EMAIL_TBD site docs`).
- **Site must be live** at the three URLs above before submission, since Play checks the privacy policy and account-deletion URLs.
- **Premium wording.** The listing says premium is "planned" and "not for sale yet". Do not enable a purchase flow without updating the listing, the terms and the Data safety form (payments).

## 7. Length check

| Field | Limit | Actual |
|---|---|---|
| App name | 30 | 27 |
| Short description | 80 | 78 |
| Full description | 4000 | 2902 |
| What's new | 500 | 259 |
| Screenshot headlines | 30 each | 22; 27; 20; 22; 20; 24; 29; 27 |
