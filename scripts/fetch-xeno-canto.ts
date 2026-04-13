/**
 * Fetch bird song recordings from XenoCanto for a quiz.
 * Uses scientific names for precise matching and proximity sorting.
 * Skips XC IDs already in the CSV (active or rejected).
 *
 * Usage:
 *   npx tsx scripts/fetch-xeno-canto.ts <quiz-id>              # fetch for all species
 *   npx tsx scripts/fetch-xeno-canto.ts <quiz-id> --missing     # only species without active recording
 *
 * Examples:
 *   npx tsx scripts/fetch-xeno-canto.ts mcgolrick-april
 *   npx tsx scripts/fetch-xeno-canto.ts nyc-spring-warblers --missing
 */

import * as XenoCanto from 'xeno-canto-api-ts';
import { readFileSync, existsSync } from 'fs';
import { writeFile, mkdir, appendFile } from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '../.env');
const API_KEY = readFileSync(envPath, 'utf-8')
  .split('\n')
  .find((line) => line.startsWith('XENO_CANTO_API_KEY='))
  ?.split('=')[1]
  ?.trim();

if (!API_KEY) throw new Error('XENO_CANTO_API_KEY not found in .env');

const SPECTRO_DIR = path.join(__dirname, '../static/quiz/spectrograms');

// Default coordinates for proximity sorting (Central Park, NYC)
// Override with --lat and --lon CLI args for non-NYC quizzes
let TARGET_LAT = 40.7829;
let TARGET_LON = -73.9654;

interface SpeciesEntry {
  common: string;
  gen: string;
  sp: string;
}

type XCRecording = Awaited<
  ReturnType<typeof XenoCanto.search>
>['xcResponse']['recordings'][number];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function distanceFromTarget(lat: string, lon: string): number {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  if (isNaN(la) || isNaN(lo)) return Infinity;
  return Math.sqrt((la - TARGET_LAT) ** 2 + (lo - TARGET_LON) ** 2);
}

// cspell:disable
const CSV_HEADER =
  'commonName,scientificName,audioFile,spectrogramFile,xenoCantoId,recordist,rejected,difficulty,quality,country,loc';
// cspell:enable

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else current += char;
  }
  fields.push(current);
  return fields;
}

function readExistingCSV(csvPath: string): {
  xcIds: Set<string>;
  activeSpecies: Set<string>;
} {
  if (!existsSync(csvPath))
    return { xcIds: new Set(), activeSpecies: new Set() };
  const csv = readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { xcIds: new Set(), activeSpecies: new Set() };
  const headers = parseCSVLine(lines[0]);
  const xcIds = new Set<string>();
  const activeSpecies = new Set<string>();

  for (const line of lines.slice(1)) {
    const fields = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = fields[i] ?? ''));
    xcIds.add(row.xenoCantoId);
    if (row.rejected !== 'true') activeSpecies.add(row.commonName);
  }
  return { xcIds, activeSpecies };
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const fullUrl = url.startsWith('//') ? `https:${url}` : url;
  const response = await fetch(fullUrl);
  if (!response.ok)
    throw new Error(`Failed to download ${fullUrl}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, buffer);
}

async function fetchRecording(
  gen: string,
  sp: string,
  skipIds: Set<string>
): Promise<{ recording: XCRecording } | null> {
  const tiers = [
    {
      opts: { key: API_KEY, gen, sp, q: 'A', type: 'song' },
      label: 'q:A song',
    },
    { opts: { key: API_KEY, gen, sp, type: 'song' }, label: 'any song' },
    { opts: { key: API_KEY, gen, sp, type: 'call' }, label: 'call' },
    { opts: { key: API_KEY, gen, sp }, label: 'any' },
  ];

  let bestTierIdx = -1;

  for (let tierIdx = 0; tierIdx < tiers.length; tierIdx++) {
    const result = await XenoCanto.search(tiers[tierIdx].opts);
    // Sort candidates by distance, filter out already-tried IDs
    const candidates = result.xcResponse.recordings
      .filter((r) => !skipIds.has(r.id))
      .sort(
        (a, b) =>
          distanceFromTarget(a.lat, a.lon) - distanceFromTarget(b.lat, b.lon)
      );

    // Try candidates in order until we find one that serves MP3
    for (const rec of candidates) {
      const url = `https://xeno-canto.org/${rec.id}/download`;
      const headResp = await fetch(url, { method: 'HEAD' });
      const contentType = headResp.headers.get('content-type') ?? '';

      if (contentType.includes('wav')) {
        // WAV — skip, Safari can't play these
        continue;
      }

      // Found an MP3 (or other playable format)
      if (bestTierIdx === -1) bestTierIdx = tierIdx;
      if (tierIdx > 0) {
        console.log(
          `    ⚠ Dropped to tier "${tiers[tierIdx].label}" (best tier was WAV-only)`
        );
      }
      return { recording: rec };
    }

    // All candidates in this tier were WAV — try next tier
    if (candidates.length > 0 && bestTierIdx === -1) {
      bestTierIdx = tierIdx;
      console.log(
        `    ⚠ All ${candidates.length} results in tier "${tiers[tierIdx].label}" are WAV, trying next tier...`
      );
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const quizId = args.find((a) => !a.startsWith('--'));
  const missingOnly = args.includes('--missing');

  // Override target coordinates if provided
  const latIdx = args.indexOf('--lat');
  const lonIdx = args.indexOf('--lon');
  if (latIdx !== -1 && args[latIdx + 1]) {
    TARGET_LAT = parseFloat(args[latIdx + 1]);
  }
  if (lonIdx !== -1 && args[lonIdx + 1]) {
    TARGET_LON = parseFloat(args[lonIdx + 1]);
  }

  if (!quizId) {
    console.error(
      'Usage: npx tsx scripts/fetch-xeno-canto.ts <quiz-id> [--missing] [--lat N --lon N]'
    );
    console.error('Available quizzes:');
    const { readdirSync } = await import('fs');
    const quizzesDir = path.join(__dirname, '../src/quiz/quizzes');
    readdirSync(quizzesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .forEach((d) => console.error(`  ${d.name}`));
    process.exit(1);
  }

  const quizDir = path.join(__dirname, '../src/quiz/quizzes', quizId);
  const speciesPath = path.join(quizDir, 'species.json');
  const csvPath = path.join(quizDir, 'recordings.csv');

  if (!existsSync(speciesPath)) {
    console.error(`species.json not found in ${quizDir}`);
    process.exit(1);
  }

  // Ensure CSV exists with header
  if (!existsSync(csvPath)) {
    await writeFile(csvPath, CSV_HEADER + '\n');
  }

  await mkdir(SPECTRO_DIR, { recursive: true });

  const species: SpeciesEntry[] = JSON.parse(
    readFileSync(speciesPath, 'utf-8')
  );
  const { xcIds, activeSpecies } = readExistingCSV(csvPath);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const sp of species) {
    if (missingOnly && activeSpecies.has(sp.common)) {
      skipped++;
      continue;
    }

    const slug = slugify(sp.common);
    console.log(`  Fetching: ${sp.common} (${sp.gen} ${sp.sp})...`);

    try {
      const result = await fetchRecording(sp.gen, sp.sp, xcIds);
      if (!result) {
        console.error('  ✗ No MP3 recordings found (all candidates were WAV)');
        failed++;
        continue;
      }

      const { recording: rec } = result;

      // Download spectrogram
      const spectroPath = path.join(SPECTRO_DIR, `${slug}.png`);
      const spectroUrl = rec.sono.med || rec.sono.large;
      if (spectroUrl) await downloadFile(spectroUrl, spectroPath);

      const rawRecordist = rec.rec ?? '';
      const rawLoc = rec.loc ?? '';
      const recordist = rawRecordist.includes(',')
        ? `"${rawRecordist}"`
        : rawRecordist;
      const loc = rawLoc.includes(',') ? `"${rawLoc}"` : rawLoc;
      const csvLine = `${sp.common},${rec.gen} ${rec.sp},/quiz/audio/${slug}.mp3,/quiz/spectrograms/${slug}.png,${rec.id},${recordist},,medium,,${rec.cnt},${loc}`;
      await appendFile(csvPath, csvLine + '\n');

      xcIds.add(rec.id);

      const dist = distanceFromTarget(rec.lat, rec.lon);
      fetched++;
      console.log(
        `  ✓ XC${rec.id} (${rec.en}, ${rec.type}, q:${rec.q}, ${rec.cnt}, dist:${dist.toFixed(1)})`
      );

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ${sp.common}: ${err}`);
      failed++;
    }
  }

  console.log(
    `\nDone! ${fetched} fetched, ${skipped} skipped, ${failed} failed`
  );
  console.log(`Now run: npx tsx scripts/build-recordings.ts ${quizId}`);
}

main().catch(console.error);
