# Tweeter — Bird Song Quiz

## Overview

A bird song identification quiz. Users hear a recording, see a spectrogram, and type the bird's name. Points are awarded for correct answers with a speed bonus.

## Architecture

- **Docusaurus page** at `/tweeter` — wraps the React quiz in a `BrowserOnly` component with MUI theme
- **Audio**: Streamed directly from XenoCanto's CDN (`https://xeno-canto.org/{id}/download`) — no auth needed, no local audio files in the deploy
- **Spectrograms**: Downloaded from XenoCanto once via the fetch script, committed to `static/quiz/spectrograms/` (~1.2MB total)
- **Data**: `src/quiz/data/recordings.csv` is the source of truth. A build script generates `recordings.json` from it, filtering out rejected entries. The CSV has columns for difficulty, quality rating, and rejection status.
- **Taxonomy**: The autocomplete options come from `recordings.json` itself (not the full eBird taxonomy), so users only see birds that are in the quiz pool.

## Key Design Decisions

- **CSV-driven curation**: The CSV lets you hand-edit difficulty, quality, and rejection status. The admin page (`/tweeter/admin`, dev only) provides a UI for this, writing back to the CSV via a Vite dev server middleware. This won't work in the Docusaurus dev server — the admin was built for the original Vite setup in beak-v1.
- **XenoCanto CDN for audio**: Avoids 379MB of audio in git. The download URLs are public (no API key). The API key is only needed for the search endpoint when fetching new recordings.
- **Points**: Base 100 pts for correct + up to 100 speed bonus (full bonus <3s, decays to 0 by 6s). Multiplied by difficulty (easy 1x, medium 1.5x, hard 2x). Timer only runs while audio is playing.
- **30s clip limit**: Audio cuts off at 30 seconds regardless of recording length.
- **No auto-play on first load**: First question requires manual play; subsequent questions auto-play.
- **Auto-advance**: After answering, a 3-second countdown auto-advances to the next question (with a visual fill on the Next button). User can click Next to skip the wait.

## File Layout

```
src/quiz/
  Quiz.tsx              # Top-level orchestrator (shuffle, state, scoring)
  QuizCard.tsx          # Single question: spectrogram + audio + input + timer
  QuizResults.tsx       # End-of-round score + answer review
  AudioPlayer.tsx       # HTML5 audio with play/pause, seek, 30s limit
  SpeciesAutocomplete.tsx  # MUI Autocomplete from recordings.json
  Admin.tsx             # Dev-only admin table (works with Vite, not Docusaurus)
  types.ts              # Types + point calculation logic
  data/
    recordings.csv      # Source of truth (hand-editable)
    recordings.json     # Generated from CSV (committed, used at runtime)

src/pages/tweeter.tsx                  # Docusaurus page wrapper
src/components/TweeterThemeWrapper.tsx # MUI theme bridge

scripts/
  fetch-xeno-canto.ts    # Download recordings from XenoCanto API
  build-recordings.ts    # CSV → JSON build script
  test-xeno-canto.ts     # One-off API test

static/quiz/spectrograms/  # ~46 spectrogram PNGs
```

## Scripts

- `npx tsx scripts/fetch-xeno-canto.ts` — Fetch new recordings. Requires `XENO_CANTO_API_KEY` in `.env`. Prefers nearby recordings (sorts by distance from McGolrick Park). Downloads audio + spectrograms.
- `npx tsx scripts/build-recordings.ts` — Rebuild `recordings.json` from `recordings.csv`. Run after editing the CSV.

## TODO

### High Priority
- [ ] **Admin page for Docusaurus**: The admin page was built for Vite's dev middleware. It needs a Docusaurus-compatible approach (could be a simple local Express server, or just edit the CSV directly).
- [ ] **Re-fetch recordings with proximity sorting**: The current recordings were fetched before the proximity feature was added. Re-run `fetch-xeno-canto.ts` to get closer recordings (e.g., the Peregrine Falcon is from Europe).
- [ ] **Replace bad recordings**: Pine Warbler, Yellow Warbler, Rock Pigeon all returned wrong species from XenoCanto. Need to find correct recordings for these (and the 4 species that had 0 results: European Starling, Blue-gray Gnatcatcher, Yellow-rumped Warbler, Gray Catbird).
- [ ] **Dynamic bird list**: Currently hardcoded to ~50 McGolrick Park April birds. Eventually pull from eBird API based on user-selected hotspot + month.

### Medium Priority
- [ ] **Hotspot + month selection UI**: Let users pick any eBird hotspot and month, then dynamically fetch the bird list and recordings.
- [ ] **Spectrogram from XenoCanto CDN**: Like audio, spectrograms could be served from XenoCanto URLs at runtime instead of committed to git.
- [ ] **Better difficulty assignment**: Currently hand-assigned. Could be data-driven based on species frequency at the location.
- [ ] **Quality curation pass**: Listen to all recordings and rate quality 1-3 in the CSV. Reject bad ones.

### Low Priority / Future
- [ ] **Persistent scores**: Track scores across sessions (localStorage or backend).
- [ ] **Difficulty modes**: Let users filter by easy/medium/hard.
- [ ] **Multi-round streaks**: Track consecutive correct answers.
- [ ] **Share results**: Screenshot/share score card (like Chirped).
- [ ] **Mobile optimization**: Test and polish mobile layout.
- [ ] **Move to API**: Push bird list + recording selection to the backend (cloaca) instead of hardcoded frontend data.
