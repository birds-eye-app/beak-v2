import React from 'react';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { BigDay } from './api';
import { checklistUrl, hotspotUrl } from './api';
import { formatKm, formatMinutes, formatTime } from './format';
import { RouteMap } from './RouteMap';

type Props = { day: BigDay; dark: boolean };

/** The expanded row: the day's checklists in start-time order, each linked, plus the route map. */
export function DayDetail({ day, dark }: Props) {
  const cumulative = runningSpeciesNote(day);
  return (
    <div className="big-days-detail">
      <div className="big-days-detail-lists">
        <Typography variant="subtitle2" gutterBottom>
          {day.n_checklists} checklist{day.n_checklists === 1 ? '' : 's'} at{' '}
          {day.n_localities} location{day.n_localities === 1 ? '' : 's'}
          {day.minutes ? ` · ${formatMinutes(day.minutes)} birding` : ''}
          {day.km ? ` · ${formatKm(day.km)} traveled` : ''}
        </Typography>
        <ol className="big-days-checklists">
          {day.checklists.map((c, i) => (
            <li key={c.id}>
              <span className="big-days-stop-index">{i + 1}</span>
              <div className="big-days-checklist-main">
                <div>
                  <Link
                    href={checklistUrl(c.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.locality}
                  </Link>
                  {c.hotspot && ' '}
                  {c.hotspot && (
                    <Link
                      href={hotspotUrl(c.locality_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="big-days-hotspot-link"
                      title="eBird hotspot"
                    >
                      hotspot
                    </Link>
                  )}
                </div>
                <div className="big-days-checklist-meta">
                  {c.time ? formatTime(c.time) : 'no start time'}
                  {c.minutes ? ` · ${formatMinutes(c.minutes)}` : ''}
                  {c.km ? ` · ${formatKm(c.km)}` : ''}
                  {c.protocol ? ` · ${c.protocol}` : ''}
                  {!c.complete && ' · incomplete'}
                </div>
              </div>
              <Chip
                size="small"
                label={`${c.n_species} sp.`}
                variant={
                  c.n_species === maxSpecies(day) ? 'filled' : 'outlined'
                }
              />
            </li>
          ))}
        </ol>
        {cumulative && (
          <Typography variant="caption" color="text.secondary">
            {cumulative}
          </Typography>
        )}
        {day.party_size > 1 && (
          <Typography variant="caption" color="text.secondary" display="block">
            Shared checklists: this day also appears on the accounts of{' '}
            {day.members.filter((m) => m !== day.observer_id).join(', ')}.
          </Typography>
        )}
      </div>
      <div className="big-days-detail-map">
        <RouteMap checklists={day.checklists} dark={dark} />
      </div>
    </div>
  );
}

function maxSpecies(day: BigDay): number {
  return day.checklists.reduce((m, c) => Math.max(m, c.n_species), 0);
}

/** "The best single list had 69; the day's 103 came from combining 11." */
function runningSpeciesNote(day: BigDay): string | null {
  if (day.n_checklists < 2) return null;
  const best = maxSpecies(day);
  const sum = day.checklists.reduce((s, c) => s + c.n_species, 0);
  return `The biggest single checklist had ${best} species; the lists add to ${sum}, and ${day.n_species} of those were distinct.`;
}
