/**
 * Tiny admin API server for updating recordings.csv.
 * Run alongside the Docusaurus dev server.
 *
 * Usage: npx tsx scripts/admin-server.ts
 * Endpoints:
 *   GET  /api/recordings         — all rows as JSON
 *   POST /api/recording/update   — { xenoCantoId, rejected?, difficulty?, quality? }
 */

import { createServer } from 'http';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../src/quiz/data/recordings.csv');
const PORT = 3001;

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

function readCSV() {
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line) => {
      const fields = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = fields[i] ?? ''));
      return row;
    }),
    raw: csv,
  };
}

// Column indices
const COLS: Record<string, number> = {
  xenoCantoId: 4,
  recordist: 5,
  rejected: 6,
  difficulty: 7,
  quality: 8,
};

function updateRow(xenoCantoId: string, updates: Record<string, string>) {
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.split('\n');
  const updated = lines.map((line, i) => {
    if (i === 0) return line;
    const fields = parseCSVLine(line);
    if (fields[COLS.xenoCantoId] !== xenoCantoId) return line;

    for (const [key, val] of Object.entries(updates)) {
      if (key in COLS) fields[COLS[key]] = val;
    }
    // Re-quote recordist if it contains commas
    const rec = fields[COLS.recordist];
    if (rec.includes(',')) fields[COLS.recordist] = `"${rec}"`;
    return fields.join(',');
  });
  writeFileSync(CSV_PATH, updated.join('\n'));
  execSync('npx tsx scripts/build-recordings.ts', {
    cwd: path.join(__dirname, '..'),
  });
}

const server = createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/recordings' && req.method === 'GET') {
    const { rows } = readCSV();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rows));
    return;
  }

  if (req.url === '/api/recording/update' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const { xenoCantoId, ...updates } = JSON.parse(body);
      updateRow(xenoCantoId, updates);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Admin API running at http://localhost:${PORT}`);
  console.log(`  GET  http://localhost:${PORT}/api/recordings`);
  console.log(`  POST http://localhost:${PORT}/api/recording/update`);
});
