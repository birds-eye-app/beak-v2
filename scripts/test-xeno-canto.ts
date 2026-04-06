/**
 * Quick test: fetch a single recording from XenoCanto API v3
 * Usage: npx tsx scripts/test-xeno-canto.ts
 */

import * as XenoCanto from "xeno-canto-api-ts";
import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");
const API_KEY = readFileSync(envPath, "utf-8")
  .split("\n")
  .find((line) => line.startsWith("XENO_CANTO_API_KEY="))
  ?.split("=")[1]
  ?.trim();

if (!API_KEY) {
  throw new Error("XENO_CANTO_API_KEY not found in .env");
}

async function main() {
  // Test 1: Basic search
  console.log("=== Test 1: Basic en search ===\n");
  const r1 = await XenoCanto.search({ key: API_KEY, en: "American Robin" });
  console.log("Status:", r1.rawResponse.status);
  console.log("Num recordings:", r1.xcResponse.numRecordings);
  if (r1.xcResponse.recordings[0]) {
    const rec = r1.xcResponse.recordings[0];
    console.log("  First: type=%s q=%s", rec.type, rec.q);
  }

  // Test 2: With quality and type filters
  console.log("\n=== Test 2: With q + type filters ===\n");
  const r2 = await XenoCanto.search({
    key: API_KEY,
    en: "American Robin",
    q: "A",
    type: "song",
  });
  console.log("Status:", r2.rawResponse.status);
  console.log("Num recordings:", r2.xcResponse.numRecordings);
  if (r2.xcResponse.recordings[0]) {
    const rec = r2.xcResponse.recordings[0];
    console.log("  First: type=%s q=%s id=%s", rec.type, rec.q, rec.id);
  }

  // Test 3: Just type filter (no quality)
  console.log("\n=== Test 3: Just type:song ===\n");
  const r3 = await XenoCanto.search({
    key: API_KEY,
    en: "American Robin",
    type: "song",
  });
  console.log("Status:", r3.rawResponse.status);
  console.log("Num recordings:", r3.xcResponse.numRecordings);
  if (r3.xcResponse.recordings[0]) {
    const rec = r3.xcResponse.recordings[0];
    console.log("  First: type=%s q=%s id=%s", rec.type, rec.q, rec.id);
    console.log("  File URL:", rec.file);
    console.log("  Sono med:", rec.sono.med);

    // Test 4: Download audio
    console.log("\n=== Test 4: Download audio ===\n");
    const audioResp = await fetch(rec.file);
    console.log("Audio status:", audioResp.status);
    console.log("Content-Type:", audioResp.headers.get("content-type"));
    const buffer = Buffer.from(await audioResp.arrayBuffer());
    const testPath = path.join(
      __dirname,
      "../public/quiz/audio/test-american-robin.mp3",
    );
    await writeFile(testPath, buffer);
    console.log(`Saved ${buffer.length} bytes to test-american-robin.mp3`);

    // Test 5: Download spectrogram
    console.log("\n=== Test 5: Download spectrogram ===\n");
    const spectroUrl = `https:${rec.sono.med}`;
    const spectroResp = await fetch(spectroUrl);
    console.log("Spectro status:", spectroResp.status);
    const specBuffer = Buffer.from(await spectroResp.arrayBuffer());
    const specPath = path.join(
      __dirname,
      "../public/quiz/spectrograms/test-american-robin.png",
    );
    await writeFile(specPath, specBuffer);
    console.log(`Saved ${specBuffer.length} bytes to test-american-robin.png`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
