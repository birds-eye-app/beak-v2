import type { Filters, Level } from './api';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const LEVEL_LABEL: Record<Level, string> = {
  country: 'Country',
  state: 'State / province',
  county: 'County',
};

export const CHILD_LABEL: Record<Level, string | null> = {
  country: 'States & provinces',
  state: 'Counties',
  county: null,
};

/** "2025-05-10" -> "May 10, 2025" without timezone surprises (no Date parsing of a bare date). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
}

/** 786 -> "13h 06m"; 50 -> "50m"; null -> "". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return '';
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** 18.938 -> "18.9 km"; 0.4 -> "0.4 km"; 123.4 -> "123 km"; null -> "". */
export function formatKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return '';
  return `${km >= 100 ? km.toFixed(0) : km.toFixed(1)} km`;
}

/** "05:20:00" -> "5:20 AM". */
export function formatTime(t: string | null | undefined): string {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('en-US');
}

/** "Solo", "Party of 3" — from the day's max "number of observers"; never a name or an id. */
export function partyLabel(observers: number): string {
  if (!observers || observers <= 1) return 'Solo';
  return `Party of ${observers}`;
}

export type PageState = { region: string; filters: Filters };

/** Pseudo-region for the country list; not a code the API knows. */
export const WORLD = 'WORLD';
const DEFAULT_REGION = 'US';

/** Shareable URL state: ?r=US-NY-005&y=2025&m=5&solo=1 */
export function parsePageState(search: string): PageState {
  const p = new URLSearchParams(search);
  const region = (p.get('r') ?? DEFAULT_REGION).toUpperCase();
  const y = Number(p.get('y'));
  const m = Number(p.get('m'));
  return {
    region:
      region === WORLD || /^[A-Z]{2}(-[A-Z0-9]{1,8}){0,2}$/.test(region)
        ? region
        : DEFAULT_REGION,
    filters: {
      year: Number.isInteger(y) && y >= 1800 && y <= 2100 ? y : null,
      month: Number.isInteger(m) && m >= 1 && m <= 12 ? m : null,
      shared: p.get('shared') === '1',
      event: p.get('event') === '1',
    },
  };
}

export function serializePageState(s: PageState): string {
  const p = new URLSearchParams();
  if (s.region !== DEFAULT_REGION) p.set('r', s.region);
  if (s.filters.year) p.set('y', String(s.filters.year));
  if (s.filters.month) p.set('m', String(s.filters.month));
  if (s.filters.shared) p.set('shared', '1');
  if (s.filters.event) p.set('event', '1');
  const q = p.toString();
  return q ? `?${q}` : '';
}

/** One line describing the active filters, e.g. "May 2025". */
export function describeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.month && f.year) parts.push(`${MONTHS[f.month - 1]} ${f.year}`);
  else if (f.year) parts.push(String(f.year));
  else if (f.month) parts.push(`${MONTHS[f.month - 1]}, any year`);
  else parts.push('All time');
  if (f.event) parts.push('Global & October Big Days');
  if (f.shared) parts.push('incl. shared accounts');
  return parts.join(' · ');
}
