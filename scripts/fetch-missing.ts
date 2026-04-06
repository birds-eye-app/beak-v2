/**
 * Fetch recordings for species missing from the current quiz data.
 * Downloads spectrograms to static/quiz/spectrograms/ and appends to recordings.csv.
 *
 * Usage: npx tsx scripts/fetch-missing.ts
 */

import * as XenoCanto from "xeno-canto-api-ts";
import { readFileSync, existsSync } from "fs";
import { writeFile, mkdir, appendFile } from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, "../.env");
const API_KEY = readFileSync(envPath, "utf-8")
  .split("\n")
  .find((line) => line.startsWith("XENO_CANTO_API_KEY="))
  ?.split("=")[1]
  ?.trim();

if (!API_KEY) throw new Error("XENO_CANTO_API_KEY not found in .env");

const SPECTRO_DIR = path.join(__dirname, "../static/quiz/spectrograms");
const CSV_PATH = path.join(__dirname, "../src/quiz/data/recordings.csv");

// McGolrick Park coordinates for proximity sorting
const TARGET_LAT = 40.7232;
const TARGET_LON = -73.9422;

const SPECIES_TO_FETCH = [
  "European Starling",
  "Laughing Gull",
  "American Crow",
  "Fish Crow",
  "Yellow-rumped Warbler",
  "Gray Catbird",
  "Blue-headed Vireo",
  "Double-crested Cormorant",
  "Scarlet Tanager",
  "Canada Goose",
  "Rose-breasted Grosbeak",
  "Northern Yellow Warbler",
  "Swamp Sparrow",
  "Black-throated Blue Warbler",
  "Great Crested Flycatcher",
  "Prairie Warbler",
  "American Herring Gull",
  "Brown Thrasher",
  // Re-fetch rejected species that are in top 50
  "White-throated Sparrow",
  "Yellow-bellied Sapsucker",
  "Hermit Thrush",
  "Pine Warbler",
  "Black-capped Chickadee",
  "Brown Creeper",
];

type XCRecording = Awaited<
  ReturnType<typeof XenoCanto.search>
>["xcResponse"]["recordings"][number];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function distanceFromTarget(lat: string, lon: string): number {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  if (isNaN(la) || isNaN(lo)) return Infinity;
  return Math.sqrt((la - TARGET_LAT) ** 2 + (lo - TARGET_LON) ** 2);
}

function pickClosest(recs: XCRecording[]): XCRecording {
  return recs.reduce((best, rec) => {
    return distanceFromTarget(rec.lat, rec.lon) <
      distanceFromTarget(best.lat, best.lon)
      ? rec
      : best;
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const fullUrl = url.startsWith("//") ? `https:${url}` : url;
  const response = await fetch(fullUrl);
  if (!response.ok)
    throw new Error(`Failed to download ${fullUrl}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, buffer);
}

async function fetchRecording(
  species: string,
): Promise<XCRecording | null> {
  const attempts: Parameters<typeof XenoCanto.search>[0][] = [
    { key: API_KEY, en: species, q: "A", type: "song" },
    { key: API_KEY, en: species, type: "song" },
    { key: API_KEY, en: species, type: "call" },
    { key: API_KEY, en: species },
  ];

  for (const opts of attempts) {
    const result = await XenoCanto.search(opts);
    if (result.xcResponse.recordings.length > 0) {
      return pickClosest(result.xcResponse.recordings);
    }
  }
  return null;
}

async function main() {
  await mkdir(SPECTRO_DIR, { recursive: true });

  // Read existing CSV to check what we already have
  const existingCsv = readFileSync(CSV_PATH, "utf-8");
  const existingIds = new Set(
    existingCsv.split("\n").map((line) => {
      const parts = line.split(",");
      return parts[4]; // xenoCantoId column
    }),
  );

  let fetched = 0;
  let failed = 0;

  for (const species of SPECIES_TO_FETCH) {
    const slug = slugify(species);
    console.log(`  Fetching: ${species}...`);

    try {
      const rec = await fetchRecording(species);
      if (!rec) {
        console.error(`  ✗ No recordings found for ${species}`);
        failed++;
        continue;
      }

      // Download spectrogram
      const spectroPath = path.join(SPECTRO_DIR, `${slug}.png`);
      if (!existsSync(spectroPath)) {
        const spectroUrl = rec.sono.med || rec.sono.large;
        if (spectroUrl) await downloadFile(spectroUrl, spectroPath);
      }

      const dist = distanceFromTarget(rec.lat, rec.lon);
      const audioUrl = `https://xeno-canto.org/${rec.id}/download`;

      // Check if this species already exists in CSV (re-fetch case)
      const alreadyInCsv = existingCsv
        .split("\n")
        .some((line) => line.startsWith(`${species},`));

      if (!alreadyInCsv) {
        // Append new row to CSV
        const csvLine = `${rec.en},${rec.gen} ${rec.sp},/quiz/audio/${slug}.mp3,/quiz/spectrograms/${slug}.png,${rec.id},${rec.rec},,medium,`;
        await appendFile(CSV_PATH, csvLine + "\n");
      } else {
        console.log(`    (already in CSV, updating spectrogram only)`);
      }

      fetched++;
      console.log(
        `  ✓ ${species} (XC${rec.id}, ${rec.type}, q:${rec.q}, ${rec.cnt}, dist:${dist.toFixed(1)})`,
      );

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ${species}: ${err}`);
      failed++;
    }
  }

  console.log(`\nFetched ${fetched}, failed ${failed}`);
  console.log("Now run: npx tsx scripts/build-recordings.ts");
}

main().catch(console.error);
