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
  n_species: number;
  n_checklists: number;
  n_localities: number;
  observers: number; // max "number of observers" across the day's lists (field party size)
  party_size: number; // eBird accounts sharing exactly these checklists (no ids are sent)
  minutes: number | null;
  km: number | null;
  all_complete: boolean;
  /** Pairs of the day's checklists that ran at the same time more than 5 km apart. */
  shared_pairs: number;
  /** Two or more such pairs: one account used by people in different places. */
  shared: boolean;
  /** "Global Big Day" / "October Big Day" when the date is one of eBird's count days. */
  event: string | null;
  checklists: Checklist[];
};

export type Filters = {
  year: number | null;
  month: number | null;
  /** Show shared-account days (lists running at once far apart); hidden by default. */
  shared: boolean;
  /** Only eBird's Global Big Day (May) and October Big Day dates. */
  event: boolean;
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

export class ApiError extends Error {
  status: number;
  /** 502/503/504 or a network failure: the backend is (re)starting, worth retrying. */
  retryable: boolean;
  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

/** Back-off between retries while the backend restarts (every deploy bounces it for ~90 s). */
export const RETRY_DELAYS_MS = [2000, 4000, 8000, 12000, 15000, 20000];

export type RetryNotice = (attempt: number, delayMs: number) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET JSON from the API. On 502/503/504 (Caddy while cloaca restarts, or cloaca before its
 * tables are loaded) or a network failure, retries with RETRY_DELAYS_MS, telling `onRetry`
 * each time so the page can say "restarting" instead of erroring; other statuses throw at once.
 */
export type GetOptions = {
  onRetry?: RetryNotice;
  retry?: boolean; // default true
  fetchImpl?: typeof fetch; // tests
  delays?: number[]; // tests
};

export async function getJson<T>(
  path: string,
  opts: GetOptions = {}
): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const delays = opts.retry === false ? [] : (opts.delays ?? RETRY_DELAYS_MS);
  const onRetry = opts.onRetry;
  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    let res: Awaited<ReturnType<typeof fetch>> | null = null;
    try {
      res = await fetchImpl(`${API_BASE}${path}`);
    } catch (e) {
      lastError = new ApiError(
        e instanceof Error ? e.message : 'network error',
        0,
        true
      );
      res = null;
    }
    if (res) {
      if (res.ok) return (await res.json()) as T;
      let msg = `${res.status}`;
      try {
        const body = (await res.json()) as { error?: string; detail?: string };
        msg = body.error ?? body.detail ?? msg;
      } catch {
        /* not JSON */
      }
      lastError = new ApiError(
        msg,
        res.status,
        [502, 503, 504].includes(res.status)
      );
      if (!lastError.retryable) throw lastError;
    }
    if (attempt < delays.length) {
      const delay = delays[attempt];
      onRetry?.(attempt + 1, delay);
      await sleep(delay);
    }
  }
  throw lastError as ApiError;
}

export const fetchMeta = () => getJson<Meta>('/meta');
export const fetchCountries = (onRetry?: RetryNotice) =>
  getJson<{ regions: Region[] }>('/regions', { onRetry }).then(
    (r) => r.regions
  );
export const fetchRegion = (
  code: string,
  shared = false,
  onRetry?: RetryNotice
) =>
  getJson<RegionResponse>(
    `/regions/${encodeURIComponent(code)}${shared ? '?include_shared=true' : ''}`,
    { onRetry }
  );
// Search does not retry: the user has typed on by the time a retry would land.
export const searchRegions = (q: string) =>
  getJson<{ results: SearchHit[] }>(`/search?q=${encodeURIComponent(q)}`, {
    retry: false,
  }).then((r) => r.results);

export function fetchTop(
  code: string,
  f: Filters,
  limit = 50,
  onRetry?: RetryNotice
) {
  const p = new URLSearchParams({ region: code, limit: String(limit) });
  if (f.year) p.set('year', String(f.year));
  if (f.month) p.set('month', String(f.month));
  if (f.shared) p.set('include_shared', 'true');
  if (f.event) p.set('event', 'true');
  return getJson<TopResponse>(`/top?${p.toString()}`, { onRetry });
}

export const checklistUrl = (id: string) => `https://ebird.org/checklist/${id}`;
export const hotspotUrl = (localityId: string) =>
  `https://ebird.org/hotspot/${localityId}`;
