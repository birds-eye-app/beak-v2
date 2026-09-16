import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useDebounce } from 'use-debounce';
import type { BigDay, Filters, Region, RegionResponse, SearchHit } from './api';
import {
  ApiError,
  fetchCountries,
  fetchRegion,
  fetchTop,
  searchRegions,
} from './api';
import {
  CHILD_LABEL,
  LEVEL_LABEL,
  MONTHS,
  WORLD,
  describeFilters,
  formatDate,
  formatNumber,
  parsePageState,
  serializePageState,
} from './format';
import { Leaderboard } from './Leaderboard';
import { RecordChart } from './RecordChart';
import './styles.css';

type Props = { dark: boolean; release: string | null };

export function BigDays({ dark, release }: Props) {
  const location = useLocation();
  const history = useHistory();
  const state = useMemo(
    () => parsePageState(location.search),
    [location.search]
  );
  const { region: code, filters } = state;

  const navigate = useCallback(
    (next: { region?: string; filters?: Partial<Filters> }) => {
      const merged = {
        region: next.region ?? code,
        filters: { ...filters, ...(next.filters ?? {}) },
      };
      history.push({ search: serializePageState(merged) });
    },
    [code, filters, history]
  );

  const isWorld = code === WORLD;
  const [region, setRegion] = useState<RegionResponse | null>(null);
  const [countries, setCountries] = useState<Region[] | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  // Set while the API client is waiting out a backend restart (see getJson).
  const [waiting, setWaiting] = useState<string | null>(null);
  const onRetry = useCallback(
    (attempt: number, delayMs: number) =>
      setWaiting(
        `The data service is restarting — retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt})…`
      ),
    []
  );
  const describeError = (e: Error) =>
    e instanceof ApiError && e.retryable
      ? 'The data service is restarting and did not come back in time. Reload in a minute.'
      : e.message;
  useEffect(() => {
    let live = true;
    setRegionError(null);
    setWaiting(null);
    if (isWorld) {
      setRegion(null);
      fetchCountries(onRetry)
        .then((r) => live && setCountries(r))
        .catch((e: Error) => live && setRegionError(describeError(e)))
        .finally(() => live && setWaiting(null));
    } else {
      fetchRegion(code, filters.shared, onRetry)
        .then((r) => live && setRegion(r))
        .catch((e: Error) => live && setRegionError(describeError(e)))
        .finally(() => live && setWaiting(null));
    }
    return () => {
      live = false;
    };
  }, [code, isWorld, filters.shared, onRetry]);

  const [rows, setRows] = useState<BigDay[] | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [loadingRows, setLoadingRows] = useState(false);
  useEffect(() => {
    if (isWorld) {
      setRows(null);
      return;
    }
    let live = true;
    setLoadingRows(true);
    setRowsError(null);
    fetchTop(code, filters, 50, onRetry)
      .then((r) => {
        if (!live) return;
        setRows(r.rows);
      })
      .catch((e: Error) => live && setRowsError(describeError(e)))
      .finally(() => {
        if (!live) return;
        setLoadingRows(false);
        setWaiting(null);
      });
    return () => {
      live = false;
    };
  }, [code, filters.year, filters.month, filters.solo, filters.shared]); // eslint-disable-line react-hooks/exhaustive-deps

  const info = region?.region;
  const years = useMemo(() => region?.years ?? [], [region]);
  const yearOptions = useMemo(
    () => [...years].reverse().map((y) => y.year),
    [years]
  );
  const hasFilters = Boolean(
    filters.year || filters.month || filters.solo || filters.shared
  );

  return (
    <div className="big-days">
      <section className="big-days-hero">
        <div className="big-days-inner">
          <p className="big-days-eyebrow">eBird records, by place</p>
          <h1 className="big-days-title">Big Days</h1>
          <p className="big-days-tagline">
            The most species one birder has ever recorded in a single day, for
            every country, state and county in eBird. Pick a place, narrow it
            down, and open a day to see the checklists and the route.
          </p>
          <RegionSearch onPick={(r) => navigate({ region: r.code })} />
        </div>
      </section>

      <div className="big-days-inner big-days-body">
        {waiting && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
            {waiting}
          </Alert>
        )}

        {regionError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {regionError === 'unknown region'
              ? `No big days for “${code}” — try another place.`
              : regionError}
          </Alert>
        )}

        {isWorld && countries && (
          <>
            <div className="big-days-card">
              <nav aria-label="Region" className="big-days-crumbs">
                <span className="big-days-crumb-current">World</span>
              </nav>
              <h2 className="big-days-region-name">World</h2>
              <p className="big-days-board-sub">
                {countries.length} countries with big days on record. Pick one,
                or search for a state or county above.
              </p>
            </div>
            <ChildRegions
              label="Countries, by record"
              regions={countries}
              onPick={(r) => navigate({ region: r.code })}
            />
          </>
        )}

        {region && info && (
          <>
            <div className="big-days-card">
              <nav aria-label="Region" className="big-days-crumbs">
                <button
                  type="button"
                  onClick={() => navigate({ region: WORLD })}
                >
                  World
                </button>
                {region.breadcrumb.map((c, i) => {
                  const last = i === region.breadcrumb.length - 1;
                  return (
                    <React.Fragment key={c.code}>
                      <span className="big-days-crumb-sep">/</span>
                      {last ? (
                        <span className="big-days-crumb-current">{c.name}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate({ region: c.code })}
                        >
                          {c.name}
                        </button>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
              <div className="big-days-region-head">
                <h2 className="big-days-region-name">
                  {info.name}
                  <span className="big-days-level">
                    {LEVEL_LABEL[info.level]}
                  </span>
                </h2>
              </div>
              <div className="big-days-stats">
                <Stat
                  value={info.best}
                  label={`Record · ${formatDate(info.best_date)}`}
                  record
                />
                <Stat
                  value={formatNumber(info.days)}
                  label="Birder-days recorded"
                />
                <Stat
                  value={formatNumber(info.checklists)}
                  label="Checklists"
                />
                <Stat
                  value={`${info.first_year}–${info.last_year}`}
                  label="Years with data"
                />
              </div>
            </div>

            {years.length > 1 && (
              <div className="big-days-card">
                <h3 className="big-days-section-title">Record by year</h3>
                <RecordChart
                  years={years}
                  selectedYear={filters.year}
                  onSelectYear={(year) => navigate({ filters: { year } })}
                />
              </div>
            )}

            <div className="big-days-card">
              <div className="big-days-filters">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="bd-year">Year</InputLabel>
                  <Select
                    labelId="bd-year"
                    label="Year"
                    value={filters.year ?? ''}
                    onChange={(e) => {
                      const v = e.target.value as number | '';
                      navigate({ filters: { year: v === '' ? null : v } });
                    }}
                  >
                    <MenuItem value="">All years</MenuItem>
                    {yearOptions.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div
                  className="big-days-months"
                  role="group"
                  aria-label="Month"
                >
                  <button
                    type="button"
                    className={`big-days-month ${filters.month ? '' : 'is-on'}`}
                    onClick={() => navigate({ filters: { month: null } })}
                  >
                    Any month
                  </button>
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      className={`big-days-month ${filters.month === i + 1 ? 'is-on' : ''}`}
                      onClick={() =>
                        navigate({
                          filters: {
                            month: filters.month === i + 1 ? null : i + 1,
                          },
                        })
                      }
                      aria-pressed={filters.month === i + 1}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.solo}
                      onChange={(e) =>
                        navigate({ filters: { solo: e.target.checked } })
                      }
                    />
                  }
                  label="Solo only"
                  title="Days where every checklist listed one observer"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.shared}
                      onChange={(e) =>
                        navigate({ filters: { shared: e.target.checked } })
                      }
                    />
                  }
                  label="Include shared accounts"
                  title="Days where one account filed checklists in different places at the same time — a club or tour company sharing an account — are hidden unless this is on"
                />
                <span className="big-days-filter-spacer" />
                {hasFilters && (
                  <Button
                    size="small"
                    onClick={() =>
                      navigate({
                        filters: {
                          year: null,
                          month: null,
                          solo: false,
                          shared: false,
                        },
                      })
                    }
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="big-days-card">
              <div className="big-days-board-head">
                <h3>
                  Top {rows?.length ?? 50} · {describeFilters(filters)}
                  {loadingRows && (
                    <CircularProgress
                      size={14}
                      sx={{ ml: 1 }}
                      aria-label="Loading"
                    />
                  )}
                </h3>
                <span className="big-days-board-sub">
                  Click a day for its checklists and route
                </span>
              </div>
              {rowsError && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {rowsError}
                </Alert>
              )}
              {rows && rows.length === 0 && !loadingRows && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  No days match these filters in {info.name}.
                </Alert>
              )}
              {rows && rows.length > 0 && (
                <Leaderboard rows={rows} dark={dark} record={info.best} />
              )}
            </div>

            {CHILD_LABEL[info.level] && region.children.length > 0 && (
              <ChildRegions
                label={`${CHILD_LABEL[info.level]}, by record`}
                regions={region.children}
                onPick={(r) => navigate({ region: r.code })}
              />
            )}
          </>
        )}

        {!region && !countries && !regionError && (
          <div
            style={{ display: 'flex', justifyContent: 'center', padding: 48 }}
          >
            <CircularProgress aria-label="Loading" />
          </div>
        )}

        <footer className="big-days-footer">
          <p>
            <strong>How it is counted.</strong> Species are eBird&apos;s
            countable taxa (subspecies roll up to the species; spuhs, slashes
            and hybrids do not count), approved records only, distinct across
            all of one eBirder&apos;s checklists inside the region on one
            calendar date. A state big day is the union across its counties.
            Shared checklists appear once. &ldquo;Solo&rdquo; means every
            checklist that day listed one observer. Days with more than 24 hours
            of birding on them are left out — those are accounts uploading many
            people&apos;s lists, not one birder&apos;s day. Days where one
            account filed checklists in different places at the same time — two
            lists running concurrently for ten minutes or more while over 5 km
            apart, twice or more in a day — are hidden unless you switch them
            on: that is a club or a tour company sharing an account, not a party
            birding together. The ABA&apos;s big-day rules cannot be applied
            from the data, so this is the closest honest test.
          </p>
          <p>
            <strong>What is shown.</strong> Only what eBird itself makes public:
            the eBird Basic Dataset excludes checklists marked not public and
            sensitive species, so every linked checklist is a public eBird page,
            and no one is named here.
          </p>
          <p>
            Data: eBird Basic Dataset
            {release ? `, version ${release}` : ''}. Cornell Lab of Ornithology,
            Ithaca, New York.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  record,
}: {
  value: string | number;
  label: string;
  record?: boolean;
}) {
  return (
    <div className="big-days-stat">
      <div className={`big-days-stat-value ${record ? 'is-record' : ''}`}>
        {value}
      </div>
      <div className="big-days-stat-label">{label}</div>
    </div>
  );
}

function RegionSearch({ onPick }: { onPick: (r: SearchHit) => void }) {
  const [input, setInput] = useState('');
  const [debounced] = useDebounce(input, 200);
  const [options, setOptions] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setOptions([]);
      return;
    }
    let live = true;
    setBusy(true);
    searchRegions(q)
      .then((r) => live && setOptions(r))
      .catch(() => live && setOptions([]))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [debounced]);
  return (
    <Autocomplete
      className="big-days-search"
      options={options}
      loading={busy}
      filterOptions={(x) => x}
      getOptionLabel={(o) => o.name}
      isOptionEqualToValue={(a, b) => a.code === b.code}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      value={null}
      onChange={(_, v) => {
        if (v) {
          onPick(v);
          setInput('');
        }
      }}
      noOptionsText={
        input.trim().length < 2 ? 'Type a place name' : 'No places found'
      }
      renderOption={(props, o) => (
        <li {...props} key={o.code}>
          <div className="big-days-search-hit">
            <span>
              {o.name}{' '}
              <span className="big-days-level">{LEVEL_LABEL[o.level]}</span>
            </span>
            <span className="big-days-search-meta">
              {o.breadcrumb.map((c) => c.name).join(' › ')}
              {o.breadcrumb.length ? ' · ' : ''}record {o.best}
            </span>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search for a country, state or county"
          size="medium"
        />
      )}
    />
  );
}

function ChildRegions({
  label,
  regions,
  onPick,
}: {
  label: string;
  regions: Region[];
  onPick: (r: Region) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? regions : regions.slice(0, 24);
  return (
    <div className="big-days-card">
      <h3 className="big-days-section-title">{label}</h3>
      <ul className="big-days-children-list">
        {shown.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              className="big-days-child"
              onClick={() => onPick(c)}
            >
              <span className="big-days-child-name">{c.name}</span>
              <span className="big-days-child-best">{c.best}</span>
            </button>
          </li>
        ))}
      </ul>
      {regions.length > shown.length && (
        <Button
          size="small"
          className="big-days-show-all"
          onClick={() => setShowAll(true)}
        >
          Show all {regions.length}
        </Button>
      )}
    </div>
  );
}
