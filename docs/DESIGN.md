# Relic — Narrative & Design Direction

> Status: **awaiting approval** (checkpoint 1). Nothing below is built yet.

## 1. Narrative

### Research basis
- In Apple TV+'s *Silo*, **relics** are objects from before the silo. Owning one without registering it is a crime. Enforcers confiscate them because the past is dangerous to whoever controls the present. Juliette's investigation starts with a hidden Pez dispenser (S1E6 "The Relic").
- In S3E5 "Memory", Juliette's friends restore her lost memories by handing her relics from her own past. **An object brings a memory back.** That is the core idea Relic takes.
- Keepsake research and philosophy (e.g. Winkler, *Routledge Handbook of Nostalgia*, 2024) describe keepsakes as "nostalgic objects par excellence": their value is the memory they prompt, not the object itself. Nostalgia is *nostos* + *algos*, return plus ache, so the tone should be warm with an ache, not peppy.
- I found no rigorous wellbeing statistics on keepsakes, so the app makes **no numeric wellness claims** in copy or the store listing.

### Premise (original lore, subtle nods)
> *Up there, everything is forgotten. Down here, what you keep, remains.*

- The user is a **Keeper**. Their account is a private **Vault**: a shaft descending into the earth, lit by lamps.
- Every memory they keep becomes a **relic**, a physical object placed on a lit niche in the Vault. Going deeper means going further back in time: **each level is a month**.
- Nothing in the Vault is ever confiscated. That is the quiet inversion of the show: here, keeping the past is the point.

**Subtle nods** (an approved level of reference: no show names, characters, logos or artwork):
- "The Before" for memories from before you joined.
- The Vault depth gauge tops out at **Level 144**.
- The streak is called **keeping the flame**.
- A rare "unregistered relic" easter-egg copy line when you add a memory from very long ago.

### The Duck: Relic's hero asset
Reference photos: `local/relic-ref/*`. A yellow rubber-duck head on a weathered teal dispenser stem, with a steel hex nut tied to it by a clear thread. Three looks are in the references: clean and new (3D-printed), patinated (verdigris stem, grimy duck), and worn and aged.

- **Role**: the Keeper's companion and the face of the app. It appears in the app icon, splash, onboarding, empty states, the seal ritual, widgets, share-card mark, notifications and the store art.
- **Signature mechanic**: a dispenser *dispenses*. When you seal a memory, the duck's head tilts back and a small relic token slides out, then drops into the Vault. Pull-to-refresh and the "Unearthing" tilt the head the same way.
- **Ageing system**: the duck weathers with your vault. It starts clean, then gains patina at 30, 100 and 365 relics. It is the one visual that shows long-term commitment, without using a streak-shame mechanic.
- **The nut on the thread**: the "anchor". It is used as the bullet or marker glyph and the share-card mark.
- **Trademark**: the reference stem has the **PEZ** logo embossed on it. Generated assets keep the silhouette and the patina but **replace the logo with a blank or Relic-glyph stem** (see the decision in the checkpoint message).

### Relic vessels (memory types become objects)
| Content | Vessel | Reveal motion |
|---|---|---|
| Words | **Folded letter** | Unfolds; the ink writes on |
| Photo(s) | **Glass plate** | Develops from dark (the photographic plate emerges) |
| Voice (≤ 1 min) | **Echo shell** (wax cylinder) | Grooves light up as it plays |
| Place | **Map shard** | The map fragment draws its contour, and a pin glows |
| People | **Locket** | Opens to show names and faces |
| Video link | **Reel canister** | The lid twists; a styled link card opens externally |

A memory with several kinds of content takes its **primary vessel** from the richest media it contains (photo, then voice, then words), and shows the rest as **inlays**.

**Emotional weight** replaces ratings. The user drags a relic between a *feather* and a *stone*. Weight sets the relic's size and glow in the Vault and its priority for resurfacing.
**Mood light**: one of 6 lamp hues (ember, honey, moss, tide, dusk, ash) tints the relic's glow. It is the only place colour varies.

## 2. Key interfaces (deliberately not CRUD)

1. **The Descent (onboarding)**. Three cinematic beats over the shaft: the premise line, then "Every memory becomes a relic", then "Only you hold the key". Then sign in. The first action after sign-up is preserving the first relic. There is no empty dashboard.
2. **The Vault (home)**. A vertical shaft that you scroll *down* through time. Relics sit in lit niches at uneven depths, sized by weight. A depth gauge on the edge shows the level and month. Lamps flicker subtly, and there is gyro parallax. Long-press a relic to *lift* it for a peek. Tapping a level marker jumps between months. When the vault is empty, a single unlit niche glows: "Your first relic belongs here."
3. **Preserve ritual (adding a memory)** instead of a form:
   1. **What's in your hand?** Choose words, voice, or photo. Hold the mic to speak and it transcribes live (speech-to-text) into the letter.
   2. The relic forms while you write. Other options appear one at a time: *when* (defaults to now; scrub back into The Before), *where*, *who*, *weight*, *light*, *link*.
   3. **Seal it**: press and hold a wax seal for 1.2 s with rising haptics. The relic descends into the Vault, and the camera follows it down to its niche.

   Editing is the same ritual with the wax seal reopened. Deleting is "Release" with an undo toast (soft delete for 30 days).
4. **Relic view**. Full-bleed object. Tilt to catch the light (gyro), then the vessel's reveal motion plays (table above). It opens a *catalog card* with the number, date, level, place and people in archival monospace, and offers actions: share, edit, release.
5. **The Ledger (calendar)**. A year shown as a wall of tiny lamps, one per day, with brightness for the number and weight of relics. Pinch to zoom into a month, then tap a day to open its relics. Built against a `CalendarSource` interface so device-calendar sync can be added later.
6. **Unearthing (on this day / resurfacing)**. A daily ritual card: "A relic surfaced from Level 31". It is the target of the notification and the widget.
7. **Share card**. A rendered 4:5 image of the relic art, memory excerpt, date and place on textured stone or paper, with a tiny "kept in Relic" mark and a glyph. Designed to be shared on WhatsApp or Instagram stories. Two styles: *Plate* (photo-led) and *Letter* (words-led). Exported locally; nothing becomes public.
8. **Keeper's quarters (settings)**. Vault capacity shown as a lamp-oil gauge (500 MB). Today's relics as 5 wax seals. Premium waitlist, reminders, app lock, export, release the vault (account deletion).
9. **Vault door (app lock)**. Biometric or PIN, with a door-unbolt animation.

## 3. Visual system

**Mode**: dark first, dark only in v1. **Mood**: lamp light in a stone archive. Warm, tactile, quiet.

| Token | Hex | Use |
|---|---|---|
| `shaft` | `#0D0B09` | App background (deepest) |
| `stone` | `#17140F` | Surfaces, niches |
| `iron` | `#27221B` | Raised surfaces, borders |
| `paper` | `#EDE3D1` | Primary text |
| `ash` | `#A39788` | Secondary text (≥ 4.5:1 on stone; checked before build) |
| `lamp` | `#F2A54A` | The **single accent**: primary actions, focus, the flame |
| `ember / honey / moss / tide / dusk / ash-light` | relic mood lights only | Relic glows, never UI chrome |

**Type** (all OFL, bundled):
- **IM Fell DW Pica**: display only, for titles, level names and the premise lines. Old-print character.
- **Newsreader**: reading serif for memory text and body copy.
- **IBM Plex Mono**: catalog labels, numbers, dates, small caps UI labels (`RELIC Nº 0042 · LEVEL 12 · MAR 2024`).

**Materials**: subtle film grain over everything (Skia shader), soft lamp-radial gradients, paper and stone textures generated as assets. No glassmorphism, no purple gradients, no emoji icons, no generic card grids.

**Iconography**: a custom line set (1.5 px, slightly irregular, like hand-engraved) in SVG.

**Motion**: a central motion system. The signature motions are *descend* (vertical camera move with ease-in-out springs), *lift* (scale 1.04, glow up, haptic tick), *seal* (hold progress ring with escalating haptics), and *develop* (fade from dark). Durations come from tokens (120 / 220 / 420 / 900 ms). Under reduce-motion, every motion becomes a crossfade.

**Sound**: optional ambient room tone and seal thunk, off by default.

## 4. Feature ideas beyond the brief (for your yes/no)
1. **Sealed relics**: lock a relic until a future date (a capsule to your future self). Fits the private vault.
2. **Keeper's prompts**: one rotating prompt a day ("The smell of a kitchen you grew up in"). Feeds notifications and the widget.
3. **Constellations**: automatic threads by person or place ("12 relics with Ammi"). Built from tags; no AI.
4. **Vault export**: a ZIP of JSON plus media. Builds data-ownership trust (a privacy-policy selling point).
5. **Material haptics**: each vessel has its own haptic texture on lift and seal.
