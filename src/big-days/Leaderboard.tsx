import React, { Fragment, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import type { BigDay } from './api';
import { checklistUrl } from './api';
import { formatDate, formatKm, formatMinutes, partyLabel } from './format';
import { DayDetail } from './DayDetail';

type Props = { rows: BigDay[]; dark: boolean; record: number };

/**
 * Top-N list. Birders are never named or shown by id — a row shows the size of the party
 * (the day's "number of observers") and how many eBird accounts shared it; the linked
 * checklists are where eBird itself names people. A row expands into the day's route.
 */
export function Leaderboard({ rows, dark, record }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const key = (d: BigDay) => `${d.date}/${d.observer_id}`;
  const max = Math.max(record, ...rows.map((r) => r.n_species));
  return (
    <div className="big-days-rows" role="list">
      <div className="big-days-row big-days-head-row" aria-hidden="true">
        <span>#</span>
        <span>Species</span>
        <span>Date</span>
        <span className="big-days-where">First stop</span>
        <span className="big-days-cell big-days-lists">Lists</span>
        <span className="big-days-cell">Time</span>
        <span className="big-days-cell big-days-distance">Distance</span>
        <span />
      </div>
      {rows.map((d) => {
        const isOpen = open === key(d);
        const first = d.checklists[0];
        const cls = [
          'big-days-row',
          isOpen ? 'is-open' : '',
          d.n_species === record ? 'is-record' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <Fragment key={key(d)}>
            <div
              className={cls}
              role="listitem"
              tabIndex={0}
              onClick={() => setOpen(isOpen ? null : key(d))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen(isOpen ? null : key(d));
                }
              }}
              aria-expanded={isOpen}
            >
              <span
                className={`big-days-rank ${d.rank <= 3 ? `is-${d.rank}` : ''}`}
              >
                {d.rank}
              </span>
              <span className="big-days-species">
                <span className="big-days-species-n">{d.n_species}</span>
                <span className="big-days-species-bar">
                  <span
                    style={{
                      width: `${Math.round((d.n_species / max) * 100)}%`,
                    }}
                  />
                </span>
              </span>
              <span className="big-days-date">
                {formatDate(d.date)}
                <small>
                  <Tooltip title={partyTooltip(d)}>
                    <span className="big-days-party">
                      {d.observers > 1 ? (
                        <GroupIcon fontSize="inherit" />
                      ) : (
                        <PersonIcon fontSize="inherit" />
                      )}
                      {partyLabel(d.observers)}
                    </span>
                  </Tooltip>
                </small>
              </span>
              <span className="big-days-where">
                {first && (
                  <a
                    href={checklistUrl(first.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {first.locality}
                  </a>
                )}
                {d.n_localities > 1 && (
                  <small>+{d.n_localities - 1} more locations</small>
                )}
              </span>
              <span className="big-days-cell big-days-lists">
                <strong>{d.n_checklists}</strong>
              </span>
              <span className="big-days-cell">{formatMinutes(d.minutes)}</span>
              <span className="big-days-cell big-days-distance">
                {formatKm(d.km)}
              </span>
              <span className="big-days-chevron" aria-hidden="true">
                <KeyboardArrowDownIcon fontSize="small" />
              </span>
            </div>
            {isOpen && <DayDetail day={d} dark={dark} />}
          </Fragment>
        );
      })}
    </div>
  );
}

function partyTooltip(d: BigDay): string {
  const party =
    d.observers > 1
      ? `${d.observers} people in the field`
      : 'One person in the field';
  const shared =
    d.party_size > 1
      ? `; ${d.party_size} eBird accounts share these checklists`
      : '';
  return party + shared;
}
