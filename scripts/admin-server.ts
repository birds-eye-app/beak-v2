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
const QUIZZES_DIR = path.join(__dirname, '../src/quiz/quizzes');
const LEGACY_CSV = path.join(__dirname, '../src/quiz/data/recordings.csv');
const PORT = 3001;

function csvPathForQuiz(quizId?: string): string {
  if (!quizId) return LEGACY_CSV;
  return path.join(QUIZZES_DIR, quizId, 'recordings.csv');
}

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

function readCSV(csvPath: string = LEGACY_CSV) {
  const csv = readFileSync(csvPath, 'utf-8');
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

function quoteField(val: string): string {
  return val.includes(',') ? `"${val}"` : val;
}

function updateRow(
  xenoCantoId: string,
  updates: Record<string, string>,
  csvPath: string = LEGACY_CSV
) {
  const csv = readFileSync(csvPath, 'utf-8');
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  const xcIdIdx = headers.indexOf('xenoCantoId');

  const updated = lines.map((line, i) => {
    if (i === 0 || !line.trim()) return line;
    const fields = parseCSVLine(line);
    if (fields[xcIdIdx] !== xenoCantoId) return line;

    for (const [key, val] of Object.entries(updates)) {
      const idx = headers.indexOf(key);
      if (idx >= 0) fields[idx] = val;
    }
    return fields.map(quoteField).join(',');
  });
  writeFileSync(csvPath, updated.join('\n'));
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

  const parsedUrl = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const quizId = parsedUrl.searchParams.get('quiz') ?? undefined;
  const csvPath = csvPathForQuiz(quizId);

  if (parsedUrl.pathname === '/api/quizzes' && req.method === 'GET') {
    const { readdirSync } = require('fs');
    const dirs = readdirSync(QUIZZES_DIR, { withFileTypes: true })
      .filter((d: { isDirectory: () => boolean; name: string }) =>
        d.isDirectory()
      )
      .map((d: { name: string }) => d.name);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(dirs));
    return;
  }

  if (parsedUrl.pathname === '/api/recordings' && req.method === 'GET') {
    const { rows } = readCSV(csvPath);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(rows));
    return;
  }

  if (parsedUrl.pathname === '/api/recording/update' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: string) => (body += chunk));
    req.on('end', () => {
      const { xenoCantoId, ...updates } = JSON.parse(body);
      updateRow(xenoCantoId, updates, csvPath);
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
