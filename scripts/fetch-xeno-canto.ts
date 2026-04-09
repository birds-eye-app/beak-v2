/**
 * Fetch bird song recordings from XenoCanto for the quiz.
 * Uses scientific names for precise matching and proximity sorting.
 * Skips XC IDs already in the CSV (active or rejected) to avoid re-fetching bad recordings.
 * Supports multiple rows per species — rejected recordings stay in the CSV as a blocklist.
 *
 * Usage:
 *   npx tsx scripts/fetch-xeno-canto.ts           # fetch for all species
 *   npx tsx scripts/fetch-xeno-canto.ts --missing  # only species without an active recording
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
const CSV_PATH = path.join(__dirname, '../src/quiz/data/recordings.csv');

// McGolrick Park coordinates for proximity sorting
const TARGET_LAT = 40.7232;
const TARGET_LON = -73.9422;

// Top 50 McGolrick Park April birds from eBird data
// cspell:disable
const SPECIES = [
  { common: 'European Starling', gen: 'Sturnus', sp: 'vulgaris' },
  { common: 'House Sparrow', gen: 'Passer', sp: 'domesticus' },
  { common: 'American Robin', gen: 'Turdus', sp: 'migratorius' },
  { common: 'Mourning Dove', gen: 'Zenaida', sp: 'macroura' },
  { common: 'White-throated Sparrow', gen: 'Zonotrichia', sp: 'albicollis' },
  { common: 'Red-bellied Woodpecker', gen: 'Melanerpes', sp: 'carolinus' },
  { common: 'Yellow-bellied Sapsucker', gen: 'Sphyrapicus', sp: 'varius' },
  { common: 'Downy Woodpecker', gen: 'Dryobates', sp: 'pubescens' },
  { common: 'Laughing Gull', gen: 'Leucophaeus', sp: 'atricilla' },
  { common: 'Hermit Thrush', gen: 'Catharus', sp: 'guttatus' },
  { common: 'Common Grackle', gen: 'Quiscalus', sp: 'quiscula' },
  { common: 'Blue Jay', gen: 'Cyanocitta', sp: 'cristata' },
  { common: 'Northern Flicker', gen: 'Colaptes', sp: 'auratus' },
  { common: 'Northern Cardinal', gen: 'Cardinalis', sp: 'cardinalis' },
  { common: 'Ruby-crowned Kinglet', gen: 'Corthylio', sp: 'calendula' },
  { common: 'Chipping Sparrow', gen: 'Spizella', sp: 'passerina' },
  { common: 'American Crow', gen: 'Corvus', sp: 'brachyrhynchos' },
  { common: 'Fish Crow', gen: 'Corvus', sp: 'ossifragus' },
  { common: 'Black-and-white Warbler', gen: 'Mniotilta', sp: 'varia' },
  { common: 'Yellow-rumped Warbler', gen: 'Setophaga', sp: 'coronata' },
  { common: 'Gray Catbird', gen: 'Dumetella', sp: 'carolinensis' },
  { common: 'Dark-eyed Junco', gen: 'Junco', sp: 'hyemalis' },
  { common: 'Tufted Titmouse', gen: 'Baeolophus', sp: 'bicolor' },
  { common: 'Blue-headed Vireo', gen: 'Vireo', sp: 'solitarius' },
  { common: 'House Finch', gen: 'Haemorhous', sp: 'mexicanus' },
  { common: 'Ovenbird', gen: 'Seiurus', sp: 'aurocapilla' },
  { common: 'Eastern Towhee', gen: 'Pipilo', sp: 'erythrophthalmus' },
  { common: 'Double-crested Cormorant', gen: 'Nannopterum', sp: 'auritum' },
  { common: 'Baltimore Oriole', gen: 'Icterus', sp: 'galbula' },
  { common: 'Pine Warbler', gen: 'Setophaga', sp: 'pinus' },
  { common: 'Eastern Phoebe', gen: 'Sayornis', sp: 'phoebe' },
  { common: 'Scarlet Tanager', gen: 'Piranga', sp: 'olivacea' },
  { common: 'Song Sparrow', gen: 'Melospiza', sp: 'melodia' },
  { common: 'Northern Parula', gen: 'Setophaga', sp: 'americana' },
  { common: 'Red-tailed Hawk', gen: 'Buteo', sp: 'jamaicensis' },
  { common: 'Black-capped Chickadee', gen: 'Poecile', sp: 'atricapillus' },
  { common: 'Palm Warbler', gen: 'Setophaga', sp: 'palmarum' },
  { common: 'Golden-crowned Kinglet', gen: 'Regulus', sp: 'satrapa' },
  { common: 'Canada Goose', gen: 'Branta', sp: 'canadensis' },
  { common: 'Red-winged Blackbird', gen: 'Agelaius', sp: 'phoeniceus' },
  { common: 'Rose-breasted Grosbeak', gen: 'Pheucticus', sp: 'ludovicianus' },
  { common: 'Northern Yellow Warbler', gen: 'Setophaga', sp: 'aestiva' },
  { common: 'Swamp Sparrow', gen: 'Melospiza', sp: 'georgiana' },
  {
    common: 'Black-throated Blue Warbler',
    gen: 'Setophaga',
    sp: 'caerulescens',
  },
  { common: 'Brown Creeper', gen: 'Certhia', sp: 'americana' },
  { common: 'Great Crested Flycatcher', gen: 'Myiarchus', sp: 'crinitus' },
  { common: 'American Kestrel', gen: 'Falco', sp: 'sparverius' },
  { common: 'Prairie Warbler', gen: 'Setophaga', sp: 'discolor' },
  { common: 'American Herring Gull', gen: 'Larus', sp: 'smithsonianus' },
  { common: 'Brown Thrasher', gen: 'Toxostoma', sp: 'rufum' },
];
// cspell:enable

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

function readExistingCSV(): { xcIds: Set<string>; activeSpecies: Set<string> } {
  if (!existsSync(CSV_PATH))
    return { xcIds: new Set(), activeSpecies: new Set() };
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.trim().split('\n');
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
): Promise<XCRecording | null> {
  const attempts: Parameters<typeof XenoCanto.search>[0][] = [
    { key: API_KEY, gen, sp, q: 'A', type: 'song' },
    { key: API_KEY, gen, sp, type: 'song' },
    { key: API_KEY, gen, sp, type: 'call' },
    { key: API_KEY, gen, sp },
  ];

  for (const opts of attempts) {
    const result = await XenoCanto.search(opts);
    const candidates = result.xcResponse.recordings.filter(
      (r) => !skipIds.has(r.id)
    );
    if (candidates.length > 0) {
      return candidates.reduce((best, rec) =>
        distanceFromTarget(rec.lat, rec.lon) <
        distanceFromTarget(best.lat, best.lon)
          ? rec
          : best
      );
    }
  }
  return null;
}

async function main() {
  await mkdir(SPECTRO_DIR, { recursive: true });

  const missingOnly = process.argv.includes('--missing');
  const { xcIds, activeSpecies } = readExistingCSV();

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const species of SPECIES) {
    if (missingOnly && activeSpecies.has(species.common)) {
      skipped++;
      continue;
    }

    const slug = slugify(species.common);
    console.log(
      `  Fetching: ${species.common} (${species.gen} ${species.sp})...`
    );

    try {
      const rec = await fetchRecording(species.gen, species.sp, xcIds);
      if (!rec) {
        console.error(
          `  ✗ No new recordings found (all candidates already tried)`
        );
        failed++;
        continue;
      }

      // Download spectrogram
      const spectroPath = path.join(SPECTRO_DIR, `${slug}.png`);
      const spectroUrl = rec.sono.med || rec.sono.large;
      if (spectroUrl) await downloadFile(spectroUrl, spectroPath);

      const recordist = rec.rec.includes(',') ? `"${rec.rec}"` : rec.rec;
      const csvLine = `${species.common},${rec.gen} ${rec.sp},/quiz/audio/${slug}.mp3,/quiz/spectrograms/${slug}.png,${rec.id},${recordist},,medium,`;
      await appendFile(CSV_PATH, csvLine + '\n');

      xcIds.add(rec.id);

      const dist = distanceFromTarget(rec.lat, rec.lon);
      fetched++;
      console.log(
        `  ✓ XC${rec.id} (${rec.en}, ${rec.type}, q:${rec.q}, ${rec.cnt}, dist:${dist.toFixed(1)})`
      );

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ${species.common}: ${err}`);
      failed++;
    }
  }

  console.log(
    `\nDone! ${fetched} fetched, ${skipped} skipped, ${failed} failed`
  );
  console.log('Now run: npx tsx scripts/build-recordings.ts');
}

main().catch(console.error);
