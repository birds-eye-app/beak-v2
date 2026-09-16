import React, { useState } from 'react';
import type { BigDay } from './api';
import { checklistUrl } from './api';
import { formatKm, formatMinutes, formatTime } from './format';
import { RouteMap } from './RouteMap';

type Props = { day: BigDay; dark: boolean };

/** The expanded row: the day's checklists in start-time order, each linked, plus the route map. */
export function DayDetail({ day, dark }: Props) {
  const max = maxSpecies(day);
  const sum = day.checklists.reduce((s, c) => s + c.n_species, 0);
  const [openList, setOpenList] = useState<string | null>(null);
  const hasSpecies = day.checklists.some((c) => c.species && c.species.length);
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
            <React.Fragment key={c.id}>
              <li>
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
                <span className="big-days-list-counts">
                  {c.new_species != null && c.new_species > 0 && (
                    <span
                      className="big-days-list-new"
                      title="Species first seen that day on this list"
                    >
                      +{c.new_species}
                    </span>
                  )}
                  {hasSpecies && c.species && c.species.length ? (
                    <button
                      type="button"
                      className={`big-days-list-n is-button ${c.n_species === max ? 'is-max' : ''}`}
                      onClick={() =>
                        setOpenList(openList === c.id ? null : c.id)
                      }
                      aria-expanded={openList === c.id}
                    >
                      {c.n_species} sp.
                    </button>
                  ) : (
                    <span
                      className={`big-days-list-n ${c.n_species === max ? 'is-max' : ''}`}
                    >
                      {c.n_species} sp.
                    </span>
                  )}
                </span>
              </li>
              {openList === c.id && c.species && (
                <li className="big-days-species-row">
                  {c.species.join(' · ')}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
        {day.n_checklists > 1 && (
          <p className="big-days-note">
            The biggest single checklist had {max} species; the lists add to{' '}
            {sum}, and {day.n_species} of those were distinct.
            {hasSpecies && ' Click a count to see the species on that list.'}
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
