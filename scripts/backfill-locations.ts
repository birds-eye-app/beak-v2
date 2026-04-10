/**
 * Backfill country and loc columns for existing recordings CSVs.
 * Fetches location data from XenoCanto API by recording ID.
 *
 * Usage: npx tsx scripts/backfill-locations.ts <quiz-id>
 */

import * as XenoCanto from 'xeno-canto-api-ts';
import { readFileSync, writeFileSync } from 'fs';
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

async function main() {
  const quizId = process.argv[2];
  if (!quizId) {
    console.error('Usage: npx tsx scripts/backfill-locations.ts <quiz-id>');
    process.exit(1);
  }

  const csvPath = path.join(
    __dirname,
    '../src/quiz/quizzes',
    quizId,
    'recordings.csv'
  );
  const csv = readFileSync(csvPath, 'utf-8');
  const lines = csv.trimEnd().split('\n');
  let header = lines[0];

  // Add columns if missing
  if (!header.includes(',country,')) {
    header += ',country,loc';
    lines[0] = header;
  }

  const headers = parseCSVLine(header);
  const countryIdx = headers.indexOf('country');
  const locIdx = headers.indexOf('loc');
  const xcIdIdx = headers.indexOf('xenoCantoId');

  let updated = 0;
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const xcId = fields[xcIdIdx];
    const hasCountry = countryIdx < fields.length && fields[countryIdx];

    if (hasCountry) {
      continue; // already has location
    }

    console.log(`  Fetching location for XC${xcId}...`);
    try {
      const result = await XenoCanto.search({ key: API_KEY, nr: xcId });
      const rec = result.xcResponse.recordings[0];
      if (rec) {
        // Pad fields to the right length
        while (fields.length <= locIdx) fields.push('');
        fields[countryIdx] = rec.cnt;
        fields[locIdx] = rec.loc.includes(',') ? `"${rec.loc}"` : rec.loc;
        lines[i] = fields.join(',');
        console.log(`    ${rec.cnt}, ${rec.loc}`);
        updated++;
      }
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`    Error: ${err}`);
    }
  }

  writeFileSync(csvPath, lines.join('\n') + '\n');
  console.log(`\nUpdated ${updated} rows in ${csvPath}`);
}

main().catch(console.error);
