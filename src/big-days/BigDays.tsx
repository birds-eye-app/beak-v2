import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDebounce } from 'use-debounce';
import type { BigDay, Filters, Region, RegionResponse, SearchHit } from './api';
import { fetchCountries, fetchRegion, fetchTop, searchRegions } from './api';
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
      // A new region keeps the filters; a year that region never saw is dropped by the API
      // returning nothing, which the empty state explains.
      history.push({ search: serializePageState(merged) });
    },
    [code, filters, history]
  );

  const isWorld = code === WORLD;
  const [region, setRegion] = useState<RegionResponse | null>(null);
  const [countries, setCountries] = useState<Region[] | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setRegionError(null);
    if (isWorld) {
      setRegion(null);
      fetchCountries()
        .then((r) => live && setCountries(r))
        .catch((e: Error) => live && setRegionError(e.message));
    } else {
      fetchRegion(code)
        .then((r) => live && setRegion(r))
        .catch((e: Error) => live && setRegionError(e.message));
    }
    return () => {
      live = false;
    };
  }, [code, isWorld]);

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
    fetchTop(code, filters)
      .then((r) => {
        if (!live) return;
        setRows(r.rows);
      })
      .catch((e: Error) => live && setRowsError(e.message))
      .finally(() => live && setLoadingRows(false));
    return () => {
      live = false;
    };
  }, [code, filters.year, filters.month, filters.solo]); // eslint-disable-line react-hooks/exhaustive-deps

  const info = region?.region;
  const years = useMemo(() => region?.years ?? [], [region]);
  const yearOptions = useMemo(
    () => [...years].reverse().map((y) => y.year),
    [years]
  );

  return (
    <div className="big-days">
      <header className="big-days-header">
        <Typography variant="h3" component="h1" className="big-days-title">
          Big Days
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The most species one birder has ever recorded in a single day, for
          every country, state and county in eBird. Pick a place, narrow it
          down, and open a day to see the checklists and the route.
        </Typography>
      </header>

      <RegionSearch onPick={(r) => navigate({ region: r.code })} />

      {regionError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {regionError === 'unknown region'
            ? `No big days for “${code}” — try another place.`
            : `Could not load ${code}: ${regionError}`}
        </Alert>
      )}

      {isWorld && countries && (
        <>
          <Breadcrumbs aria-label="Region" className="big-days-crumbs">
            <Typography color="text.primary">World</Typography>
          </Breadcrumbs>
          <section className="big-days-region">
            <Typography variant="h4" component="h2">
              World
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {countries.length} countries. Pick one, or search for a state or
              county above.
            </Typography>
          </section>
          <ChildRegions
            label="Countries"
            regions={countries}
            onPick={(r) => navigate({ region: r.code })}
          />
        </>
      )}

      {region && info && (
        <>
          <Breadcrumbs aria-label="Region" className="big-days-crumbs">
            <Link
              component="button"
              underline="hover"
              onClick={() => navigate({ region: WORLD })}
            >
              World
            </Link>
            {region.breadcrumb.map((c, i) => {
              const last = i === region.breadcrumb.length - 1;
              return last ? (
                <Typography key={c.code} color="text.primary">
                  {c.name}
                </Typography>
              ) : (
                <Link
                  key={c.code}
                  component="button"
                  underline="hover"
                  onClick={() => navigate({ region: c.code })}
                >
                  {c.name}
                </Link>
              );
            })}
          </Breadcrumbs>

          <section className="big-days-region">
            <div>
              <Typography variant="h4" component="h2">
                {info.name}{' '}
                <span className="big-days-level">
                  {LEVEL_LABEL[info.level]}
                </span>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Record <strong>{info.best}</strong> species on{' '}
                {formatDate(info.best_date)} · {formatNumber(info.days)}{' '}
                birder-days across {formatNumber(info.checklists)} checklists,{' '}
                {info.first_year}–{info.last_year}
              </Typography>
            </div>
          </section>

          <RecordChart
            years={years}
            selectedYear={filters.year}
            onSelectYear={(year) => navigate({ filters: { year } })}
          />

          <section className="big-days-filters">
            <FormControl size="small" sx={{ minWidth: 150 }}>
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="bd-month">Month</InputLabel>
              <Select
                labelId="bd-month"
                label="Month"
                value={filters.month ?? ''}
                onChange={(e) => {
                  const v = e.target.value as number | '';
                  navigate({ filters: { month: v === '' ? null : v } });
                }}
              >
                <MenuItem value="">Any month</MenuItem>
                {MONTHS.map((m, i) => (
                  <MenuItem key={m} value={i + 1}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
            {(filters.year || filters.month || filters.solo) && (
              <Chip
                label="Clear filters"
                size="small"
                onDelete={() =>
                  navigate({
                    filters: { year: null, month: null, solo: false },
                  })
                }
                onClick={() =>
                  navigate({
                    filters: { year: null, month: null, solo: false },
                  })
                }
              />
            )}
          </section>

          <section className="big-days-board">
            <Typography
              variant="h6"
              component="h3"
              className="big-days-board-title"
            >
              Top {rows?.length ?? 50} · {describeFilters(filters)}
              {loadingRows && (
                <CircularProgress
                  size={16}
                  sx={{ ml: 1 }}
                  aria-label="Loading"
                />
              )}
            </Typography>
            {rowsError && <Alert severity="error">{rowsError}</Alert>}
            {rows && rows.length === 0 && !loadingRows && (
              <Alert severity="info">
                No days match these filters in {info.name}.
              </Alert>
            )}
            {rows && rows.length > 0 && <Leaderboard rows={rows} dark={dark} />}
          </section>

          {CHILD_LABEL[info.level] && region.children.length > 0 && (
            <ChildRegions
              label={CHILD_LABEL[info.level] as string}
              regions={region.children}
              onPick={(r) => navigate({ region: r.code })}
            />
          )}
        </>
      )}

      {!region && !countries && !regionError && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading" />
        </Box>
      )}

      <footer className="big-days-footer">
        <Typography variant="caption" color="text.secondary" component="p">
          How it is counted: species are eBird&apos;s countable taxa (subspecies
          roll up to the species; spuhs, slashes and hybrids do not count),
          approved records only, distinct across all of one eBirder&apos;s
          checklists inside the region on one calendar date. A state big day is
          the union across its counties. Shared checklists appear once, under
          the member with the most species. &ldquo;Solo&rdquo; means every
          checklist that day listed one observer.
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p">
          Data: eBird Basic Dataset
          {release ? `, version ${release}` : ''}. Cornell Lab of Ornithology,
          Ithaca, New York. Birders appear by their eBird observer id; the
          linked checklists show who they are. Days that eBirders have hidden
          from output are not in the dataset.
        </Typography>
      </footer>
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
              {o.breadcrumb.length ? ' · ' : ''}best {o.best}
            </span>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Find a country, state or county"
          placeholder="Kings, Ontario, Panama…"
          size="small"
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
    <section className="big-days-children">
      <Typography variant="h6" component="h3">
        {label} by record
      </Typography>
      <ul className="big-days-children-list">
        {shown.map((c) => (
          <li key={c.code}>
            <Link
              component="button"
              underline="hover"
              onClick={() => onPick(c)}
              className="big-days-child"
            >
              <span className="big-days-child-name">{c.name}</span>
              <span className="big-days-child-best">{c.best}</span>
            </Link>
          </li>
        ))}
      </ul>
      {regions.length > shown.length && (
        <Link
          component="button"
          underline="hover"
          onClick={() => setShowAll(true)}
        >
          Show all {regions.length}
        </Link>
      )}
    </section>
  );
}
