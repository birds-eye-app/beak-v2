/**
 * One-time script to download bird song recordings from XenoCanto
 * for the McGolrick Park / April quiz POC.
 *
 * Usage: npx tsx scripts/fetch-xeno-canto.ts
 */

import * as XenoCanto from "xeno-canto-api-ts";
import { readFileSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load API key from .env
const envPath = path.join(__dirname, "../.env");
const API_KEY = readFileSync(envPath, "utf-8")
  .split("\n")
  .find((line) => line.startsWith("XENO_CANTO_API_KEY="))
  ?.split("=")[1]
  ?.trim();

if (!API_KEY) {
  throw new Error("XENO_CANTO_API_KEY not found in .env");
}

const AUDIO_DIR = path.join(__dirname, "../public/quiz/audio");
const SPECTRO_DIR = path.join(__dirname, "../public/quiz/spectrograms");
const MANIFEST_PATH = path.join(__dirname, "../src/quiz/data/recordings.json");

// ~50 common birds for McGolrick Park, Brooklyn in April
const SPECIES = [
  "American Robin",
  "Northern Cardinal",
  "Blue Jay",
  "House Sparrow",
  "European Starling",
  "Mourning Dove",
  "Song Sparrow",
  "White-throated Sparrow",
  "Red-winged Blackbird",
  "Common Grackle",
  "Brown-headed Cowbird",
  "American Goldfinch",
  "House Finch",
  "Dark-eyed Junco",
  "Eastern Towhee",
  "Chipping Sparrow",
  "White-breasted Nuthatch",
  "Tufted Titmouse",
  "Black-capped Chickadee",
  "Downy Woodpecker",
  "Red-bellied Woodpecker",
  "Northern Flicker",
  "Yellow-bellied Sapsucker",
  "Ruby-crowned Kinglet",
  "Golden-crowned Kinglet",
  "Blue-gray Gnatcatcher",
  "Hermit Thrush",
  "Yellow-rumped Warbler",
  "Palm Warbler",
  "Pine Warbler",
  "Yellow Warbler",
  "Black-and-white Warbler",
  "Northern Parula",
  "Eastern Phoebe",
  "Red-tailed Hawk",
  "Cooper's Hawk",
  "Peregrine Falcon",
  "American Kestrel",
  "Ring-billed Gull",
  "Rock Pigeon",
  "Monk Parakeet",
  "Brown Creeper",
  "Carolina Wren",
  "House Wren",
  "Gray Catbird",
  "Northern Mockingbird",
  "Cedar Waxwing",
  "Red-eyed Vireo",
  "Baltimore Oriole",
  "Ovenbird",
];

interface ManifestEntry {
  commonName: string;
  scientificName: string;
  audioFile: string;
  spectrogramFile: string;
  xenoCantoId: string;
  recordist: string;
}

// McGolrick Park, Brooklyn
const TARGET_LAT = 40.7232;
const TARGET_LON = -73.9422;

function distanceFromTarget(lat: string, lon: string): number {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  if (isNaN(la) || isNaN(lo)) return Infinity;
  // Simple Euclidean approximation — good enough for ranking
  return Math.sqrt((la - TARGET_LAT) ** 2 + (lo - TARGET_LON) ** 2);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const fullUrl = url.startsWith("//") ? `https:${url}` : url;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${fullUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destPath, buffer);
}

type XCRecording = Awaited<
  ReturnType<typeof XenoCanto.search>
>["xcResponse"]["recordings"][number];

function pickClosest(recs: XCRecording[]): XCRecording {
  return recs.reduce((best, rec) => {
    const bestDist = distanceFromTarget(best.lat, best.lon);
    const recDist = distanceFromTarget(rec.lat, rec.lon);
    return recDist < bestDist ? rec : best;
  });
}

async function fetchRecordingForSpecies(
  species: string,
): Promise<XCRecording | null> {
  // Try high-quality song first, then progressively relax filters
  // Within each tier, pick the recording closest to target location
  const attempts: Parameters<typeof XenoCanto.search>[0][] = [
    { key: API_KEY, en: species, q: "A", type: "song" },
    { key: API_KEY, en: species, type: "song" },
    { key: API_KEY, en: species, type: "call" },
    { key: API_KEY, en: species },
  ];

  for (const opts of attempts) {
    const result = await XenoCanto.search(opts);
    if (result.xcResponse.recordings.length > 0) {
      const closest = pickClosest(result.xcResponse.recordings);
      return closest;
    }
  }

  return null;
}

async function main() {
  await mkdir(AUDIO_DIR, { recursive: true });
  await mkdir(SPECTRO_DIR, { recursive: true });

  const manifest: ManifestEntry[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const species of SPECIES) {
    const slug = slugify(species);
    const audioPath = path.join(AUDIO_DIR, `${slug}.mp3`);
    const spectroPath = path.join(SPECTRO_DIR, `${slug}.png`);

    try {
      console.log(`  Fetching: ${species}...`);
      const recording = await fetchRecordingForSpecies(species);
      if (!recording) {
        console.error(`  ✗ No recordings found for ${species}`);
        failCount++;
        continue;
      }

      // Download audio (skip if already exists)
      if (!existsSync(audioPath)) {
        await downloadFile(recording.file, audioPath);
      }

      // Download spectrogram (skip if already exists)
      if (!existsSync(spectroPath)) {
        const spectroUrl = recording.sono.med || recording.sono.large;
        if (spectroUrl) {
          await downloadFile(spectroUrl, spectroPath);
        } else {
          console.warn(`    No spectrogram for ${species}`);
        }
      }

      manifest.push({
        commonName: recording.en,
        scientificName: `${recording.gen} ${recording.sp}`,
        audioFile: `/quiz/audio/${slug}.mp3`,
        spectrogramFile: `/quiz/spectrograms/${slug}.png`,
        xenoCantoId: recording.id,
        recordist: recording.rec,
      });

      successCount++;
      const dist = distanceFromTarget(recording.lat, recording.lon);
      console.log(
        `  ✓ ${species} (XC${recording.id}, ${recording.type}, q:${recording.q}, ${recording.cnt}, dist:${dist.toFixed(1)})`,
      );

      // Be polite to the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`  ✗ ${species}: ${err}`);
      failCount++;
    }
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nDone! ${successCount} downloaded, ${failCount} failed.`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch(console.error);
