/**
 * Build recordings.json from recordings.csv.
 * - Filters out rejected entries
 * - Deduplicates: picks first non-rejected row per species (by commonName)
 *
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

const allRows = lines.slice(1).map((line) => {
  const values = parseCSVLine(line);
  const row: Record<string, string> = {};
  headers.forEach((h, i) => (row[h] = values[i] ?? ""));
  return row;
});

const totalRows = allRows.length;
const rejectedRows = allRows.filter((r) => r.rejected === "true").length;

// Deduplicate: first non-rejected row per species wins
const seen = new Set<string>();
const recordings = allRows
  .filter((row) => row.rejected !== "true")
  .filter((row) => {
    if (seen.has(row.commonName)) return false;
    seen.add(row.commonName);
    return true;
  })
  .map(
    ({
      commonName,
      scientificName,
      spectrogramFile,
      xenoCantoId,
      recordist,
      difficulty,
    }) => ({
      commonName,
      scientificName,
      audioUrl: `https://xeno-canto.org/${xenoCantoId}/download`,
      spectrogramFile,
      xenoCantoId,
      recordist,
      difficulty: difficulty || "medium",
    }),
  );

writeFileSync(JSON_PATH, JSON.stringify(recordings, null, 2) + "\n");
console.log(
  `Built ${recordings.length} unique species (${totalRows} rows, ${rejectedRows} rejected)`,
);
