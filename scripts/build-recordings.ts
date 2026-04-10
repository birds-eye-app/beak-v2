/**
 * Build recordings.json from recordings.csv for a quiz.
 * - Filters out rejected entries
 * - Deduplicates: picks first non-rejected row per species (by commonName)
 *
 * Usage:
 *   npx tsx scripts/build-recordings.ts                          # build all quizzes
 *   npx tsx scripts/build-recordings.ts mcgolrick-april          # build one quiz
 *   npx tsx scripts/build-recordings.ts nyc-spring-warblers      # build one quiz
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUIZZES_DIR = path.join(__dirname, '../src/quiz/quizzes');
// Legacy path — also rebuild if it exists
const LEGACY_CSV = path.join(__dirname, '../src/quiz/data/recordings.csv');
const LEGACY_JSON = path.join(__dirname, '../src/quiz/data/recordings.json');

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function buildQuiz(quizDir: string): void {
  const csvPath = path.join(quizDir, 'recordings.csv');
  const jsonPath = path.join(quizDir, 'recordings.json');

  if (!existsSync(csvPath)) {
    console.log(`  Skipping ${path.basename(quizDir)} (no recordings.csv)`);
    return;
  }

  buildFromCSV(csvPath, jsonPath, path.basename(quizDir));
}

function buildFromCSV(csvPath: string, jsonPath: string, label: string): void {
  const csv = readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    console.log(`  ${label}: empty CSV, writing empty JSON`);
    writeFileSync(jsonPath, '[]\n');
    return;
  }

  const headers = parseCSVLine(lines[0]);

  const allRows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ''));
    return row;
  });

  const totalRows = allRows.length;
  const rejectedRows = allRows.filter((r) => r.rejected === 'true').length;

  // Deduplicate: first non-rejected row per species wins
  const seen = new Set<string>();
  const recordings = allRows
    .filter((row) => row.rejected !== 'true')
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
        country,
        loc,
      }) => ({
        commonName,
        scientificName,
        audioUrl: `https://xeno-canto.org/${xenoCantoId}/download`,
        spectrogramFile,
        xenoCantoId,
        recordist,
        difficulty: difficulty || 'medium',
        country: country || '',
        location: loc || '',
      })
    );

  writeFileSync(jsonPath, JSON.stringify(recordings, null, 2) + '\n');
  console.log(
    `  ${label}: ${recordings.length} species (${totalRows} rows, ${rejectedRows} rejected)`
  );
}

// Main
const targetQuiz = process.argv[2];

if (targetQuiz) {
  const quizDir = path.join(QUIZZES_DIR, targetQuiz);
  if (!existsSync(quizDir)) {
    console.error(`Quiz not found: ${targetQuiz}`);
    process.exit(1);
  }
  buildQuiz(quizDir);
} else {
  console.log('Building all quizzes...');
  const dirs = readdirSync(QUIZZES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    buildQuiz(path.join(QUIZZES_DIR, dir));
  }

  // Also rebuild legacy path if it exists
  if (existsSync(LEGACY_CSV)) {
    buildFromCSV(LEGACY_CSV, LEGACY_JSON, 'legacy');
  }
}
