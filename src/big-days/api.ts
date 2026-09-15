// Big Days: the leaderboard of the biggest eBird days per country / state / county.
// Served by cloaca (birds-eye-app/cloaca, src/cloaca/big_days/) from two tables derived
// from the eBird Basic Dataset — the same public backend Birds Eye uses, which already
// sends CORS for the site. Hardcoded like src/birds-eye/api.ts: process.env is
// not available in the browser build.
const isDevelopment = false; // true -> a local cloaca on :8000
export const API_BASE = isDevelopment
  ? 'http://localhost:8000/v1/big_days'
  : 'https://cloaca.dtmeadows.me/v1/big_days';

export type Level = 'country' | 'state' | 'county';

export type Region = {
  level: Level;
  code: string;
  name: string;
  parent: string | null;
  country_code: string;
  days: number; // party-days recorded in the region, all time
  checklists: number;
  best: number; // all-time record species count
  best_date: string | null;
  first_year: number;
  last_year: number;
  lat: number | null;
  lon: number | null;
};

export type Crumb = { code: string; name: string; level: Level };

export type YearRecord = {
  year: number;
  best: number;
  best_date: string;
  observer_id: string;
  days: number | null;
  observers: number | null;
};

export type RegionResponse = {
  region: Region;
  breadcrumb: Crumb[];
  children: Region[];
  years: YearRecord[];
};

export type Checklist = {
  id: string; // eBird checklist id (S…), links to https://ebird.org/checklist/<id>
  locality: string;
  locality_id: string;
  hotspot: boolean;
  lat: number | null;
  lon: number | null;
  time: string | null; // "HH:MM:SS"
  minutes: number | null;
  km: number | null;
  n_species: number;
  complete: boolean;
  protocol: string;
};

export type BigDay = {
  rank: number;
  date: string;
  year: number;
  month: number;
  observer_id: string; // pseudonymous eBird id (obsr…); the linked checklists show who
  n_species: number;
  n_checklists: number;
  n_localities: number;
  observers: number; // max "number of observers" across the day's lists (field party size)
  solo: boolean;
  party_size: number; // eBird accounts sharing exactly these checklists
  members: string[];
  minutes: number | null;
  km: number | null;
  all_complete: boolean;
  checklists: Checklist[];
};

export type Filters = {
  year: number | null;
  month: number | null;
  solo: boolean;
};

export type TopResponse = {
  region: Pick<Region, 'code' | 'name' | 'level' | 'parent'>;
  filters: Filters & { limit: number };
  rows: BigDay[];
};

export type SearchHit = Region & { breadcrumb: Crumb[] };

export type Meta = {
  ready: boolean;
  release: string | null;
  regions?: number;
  k?: number;
  levels?: Record<Level, number>;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      msg = ((await res.json()) as { error?: string }).error ?? msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const fetchMeta = () => getJson<Meta>('/meta');
export const fetchCountries = () =>
  getJson<{ regions: Region[] }>('/regions').then((r) => r.regions);
export const fetchRegion = (code: string) =>
  getJson<RegionResponse>(`/regions/${encodeURIComponent(code)}`);
export const searchRegions = (q: string) =>
  getJson<{ results: SearchHit[] }>(`/search?q=${encodeURIComponent(q)}`).then(
    (r) => r.results
  );

export function fetchTop(code: string, f: Filters, limit = 50) {
  const p = new URLSearchParams({ region: code, limit: String(limit) });
  if (f.year) p.set('year', String(f.year));
  if (f.month) p.set('month', String(f.month));
  if (f.solo) p.set('solo', '1');
  return getJson<TopResponse>(`/top?${p.toString()}`);
}

export const checklistUrl = (id: string) => `https://ebird.org/checklist/${id}`;
export const hotspotUrl = (localityId: string) =>
  `https://ebird.org/hotspot/${localityId}`;
