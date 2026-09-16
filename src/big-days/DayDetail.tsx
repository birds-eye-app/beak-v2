import React from 'react';
import type { BigDay } from './api';
import { checklistUrl } from './api';
import { formatKm, formatMinutes, formatTime } from './format';
import { RouteMap } from './RouteMap';

type Props = { day: BigDay; dark: boolean };

/** The expanded row: the day's checklists in start-time order, each linked, plus the route map. */
export function DayDetail({ day, dark }: Props) {
  const max = maxSpecies(day);
  const sum = day.checklists.reduce((s, c) => s + c.n_species, 0);
  return (
    <div className="big-days-detail">
      <div>
        <p className="big-days-detail-summary">
          {day.n_checklists} checklist{day.n_checklists === 1 ? '' : 's'} at{' '}
          {day.n_localities} location{day.n_localities === 1 ? '' : 's'}
          {day.minutes ? ` · ${formatMinutes(day.minutes)} birding` : ''}
          {day.km ? ` · ${formatKm(day.km)} traveled` : ''}
          {day.party_size > 1
            ? ` · shared by ${day.party_size} eBird accounts`
            : ''}
        </p>
        <ol className="big-days-checklists">
          {day.checklists.map((c, i) => (
            <li key={c.id}>
              <span className="big-days-stop-index">{i + 1}</span>
              <div className="big-days-checklist-main">
                <div>
                  <a
                    href={checklistUrl(c.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.locality}
                  </a>
                </div>
                <div className="big-days-checklist-meta">
                  {c.time ? formatTime(c.time) : 'no start time'}
                  {c.minutes ? ` · ${formatMinutes(c.minutes)}` : ''}
                  {c.km ? ` · ${formatKm(c.km)}` : ''}
                  {c.protocol ? ` · ${c.protocol}` : ''}
                  {!c.complete && ' · incomplete'}
                </div>
              </div>
              <span
                className={`big-days-list-n ${c.n_species === max ? 'is-max' : ''}`}
              >
                {c.n_species} sp.
              </span>
            </li>
          ))}
        </ol>
        {day.n_checklists > 1 && (
          <p className="big-days-note">
            The biggest single checklist had {max} species; the lists add to{' '}
            {sum}, and {day.n_species} of those were distinct.
          </p>
        )}
      </div>
      <div>
        <RouteMap checklists={day.checklists} dark={dark} />
      </div>
    </div>
  );
}

function maxSpecies(day: BigDay): number {
  return day.checklists.reduce((m, c) => Math.max(m, c.n_species), 0);
}
