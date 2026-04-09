# Tweeter — Bird Song Quiz

## Overview

A bird song identification quiz. Users hear a recording, see a spectrogram, and type the bird's name. Points are awarded for correct answers with a speed bonus.

## Architecture

- **Docusaurus page** at `/tweeter` — wraps the React quiz in a `BrowserOnly` component with MUI theme
- **Audio**: Streamed directly from XenoCanto's CDN (`https://xeno-canto.org/{id}/download`) — no auth needed, no local audio files in the deploy
- **Spectrograms**: Downloaded from XenoCanto once via the fetch script, committed to `static/quiz/spectrograms/`
- **Data**: `src/quiz/data/recordings.csv` is the source of truth. A build script generates `recordings.json` from it, filtering out rejected entries and deduplicating by species (first non-rejected row wins). The CSV has columns for difficulty, quality rating, and rejection status.
- **Species list**: Top 50 birds at McGolrick Park in April, derived from eBird complete checklist frequency data (queried from the ebd_nyc DuckDB database).
- **Taxonomy**: The autocomplete options come from `recordings.json` itself (not the full eBird taxonomy), so users only see birds that are in the quiz pool.

## Points System

- Base 100 pts for a correct answer
- Speed bonus: up to 100 pts extra (full bonus <3s, decays to 0 by 6s)
- Difficulty multiplier: easy 1x, medium 1.5x, hard 2x
- Timer only runs while audio is playing — pausing stops the clock, seeking doesn't affect it
- No points deducted for wrong answers or skips

## Key Design Decisions

- **CSV-driven curation**: The CSV supports multiple rows per species. Rejected recordings stay as a blocklist so the fetch script skips them. The admin page provides a UI for reviewing, and the build script picks the first non-rejected row per species.
- **Scientific name fetching**: The fetch script uses genus + species for XenoCanto searches (not common names) to avoid mismatches like "Pine Warbler" returning "Western Subalpine Warbler".
- **Proximity sorting**: Within each quality tier, the fetch script picks the recording closest to McGolrick Park to avoid subspecies confusion (e.g., European vs American recordings).
- **XenoCanto CDN for audio**: Avoids 379MB of audio in git. The download URLs are public (no API key). The API key is only needed for the search endpoint when fetching new recordings.
- **30s clip limit**: Audio cuts off at 30 seconds regardless of recording length.
- **No auto-play on first question**: Respects browser autoplay policies. Subsequent questions auto-play.
- **Auto-advance**: After answering, a 3-second countdown auto-advances to the next question.

## File Layout

```
src/quiz/
  Quiz.tsx                  # Top-level orchestrator (shuffle, state, scoring)
  QuizCard.tsx              # Single question: spectrogram + audio + input + timer
  QuizResults.tsx           # End-of-round score + answer review
  AudioPlayer.tsx           # HTML5 audio with play/pause, seek, 30s limit
  SpeciesAutocomplete.tsx   # MUI Autocomplete from recordings.json
  Admin.tsx                 # Admin table (connects to admin-server.ts API)
  types.ts                  # Types + point calculation logic
  data/
    recordings.csv          # Source of truth (hand-editable, supports multiple rows per species)
    recordings.json         # Generated from CSV (committed, used at runtime)

src/pages/tweeter.tsx                  # Docusaurus page wrapper
src/pages/tweeter/admin.tsx            # Docusaurus admin page wrapper
src/components/TweeterThemeWrapper.tsx # MUI theme bridge for quiz
src/components/TweeterAdminWrapper.tsx # MUI theme bridge for admin

scripts/
  fetch-xeno-canto.ts    # Fetch recordings from XenoCanto API (uses scientific names)
  build-recordings.ts    # CSV → JSON build script (deduplicates per species)
  admin-server.ts        # Tiny API server for admin CSV writes (port 3001)
  fetch-missing.ts       # (legacy) One-off script for fetching missing species
  test-xeno-canto.ts     # One-off API test

static/quiz/spectrograms/  # Spectrogram PNGs (~50 files)
```

## Scripts

- `npx tsx scripts/fetch-xeno-canto.ts` — Fetch recordings for all species. Uses `XENO_CANTO_API_KEY` from `.env`. Skips XC IDs already in the CSV.
- `npx tsx scripts/fetch-xeno-canto.ts --missing` — Only fetch for species without an active (non-rejected) recording.
- `npx tsx scripts/build-recordings.ts` — Rebuild `recordings.json` from `recordings.csv`. Run after editing the CSV.
- `npx tsx scripts/admin-server.ts` — Start the admin API server on port 3001 for the admin page to write to the CSV.

## Admin Workflow

1. Start the admin server: `npx tsx scripts/admin-server.ts`
2. Start Docusaurus: `yarn start`
3. Go to `http://localhost:3000/tweeter/admin`
4. Review recordings: play audio, rate quality (1-3 stars), set difficulty, reject bad ones
5. Use "Show only unreviewed" toggle to focus on new recordings
6. Reject a recording → run `npx tsx scripts/fetch-xeno-canto.ts --missing` to get a replacement
7. Run `npx tsx scripts/build-recordings.ts` to rebuild the JSON
8. Deploy: `render deploys create srv-d1puv1fdiees738e1t10 --commit <sha> --confirm`

## TODO

### Features
- [ ] Support ability for users to create their own quizzes
    1. Select location and time and prequery for birds
    2. Allow user to select birds to include
    3. Go through each bird and suggest best songs based on quality and proximity
    4. Creator goes through and selects which recordings they do / don't want to include
    5. Then they can view the quiz and even share it with others
- [ ] Difficulty modes: Let users filter by easy/medium/hard
- [ ] Support multiple recordings per species (rotate through them across rounds)

### Polish
- [ ] Re-fetch recordings with proximity sorting for older recordings
- [ ] Spectrogram from XenoCanto CDN (serve at runtime instead of committing to git)
- [ ] Share results: Screenshot/share score card (like Chirped)
- [ ] Move to API: Push bird list + recording selection to the backend (cloaca)

### Bugs
- [ ] **Safari can't play WAV recordings**: XenoCanto's `/download` endpoint serves WAV files for roughly half the recordings. Chrome handles these fine, but Safari errors with `MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4). Fix options: (a) download recordings locally and convert to MP3 with ffmpeg, then host on S3/R2, (b) only use recordings that happen to be MP3, or (c) proxy through our own backend that transcodes on the fly.
- [ ] Fetching audio by common name is finicky — scientific name search is now the default but the species list still uses common names as the primary key in the CSV
- [ ] Fetch script is slow (sequential API calls with 500ms delay between each)
