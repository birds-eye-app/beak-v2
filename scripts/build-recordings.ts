/**
 * Build recordings.json from recordings.csv, filtering out rejected entries.
 * Usage: npx tsx scripts/build-recordings.ts
 */

import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, "../src/quiz/data/recordings.csv");
const JSON_PATH = path.join(__dirname, "../src/quiz/data/recordings.json");

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

const csv = readFileSync(CSV_PATH, "utf-8");
const lines = csv.trim().split("\n");
const headers = parseCSVLine(lines[0]);

const recordings = lines
  .slice(1)
  .map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  })
  .filter((row) => row.rejected !== "true")
  .map(
    ({
      commonName,
      scientificName,
      audioFile,
      spectrogramFile,
      xenoCantoId,
      recordist,
      difficulty,
    }) => ({
      commonName,
      scientificName,
      audioFile,
      audioUrl: `https://xeno-canto.org/${xenoCantoId}/download`,
      spectrogramFile,
      xenoCantoId,
      recordist,
      difficulty: difficulty || "medium",
    }),
  );

writeFileSync(JSON_PATH, JSON.stringify(recordings, null, 2) + "\n");
console.log(
  `Built ${recordings.length} recordings (filtered from ${lines.length - 1} total)`,
);
