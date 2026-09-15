import React, { Fragment, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import GroupIcon from '@mui/icons-material/Group';
import type { BigDay } from './api';
import { checklistUrl } from './api';
import { formatDate, formatKm, formatMinutes, observerLabel } from './format';
import { DayDetail } from './DayDetail';

type Props = { rows: BigDay[]; dark: boolean };

/** Top-N table. A row expands into the day's checklists and route. */
export function Leaderboard({ rows, dark }: Props) {
  const key = (d: BigDay) => `${d.date}/${d.observer_id}`;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Table size="small" className="big-days-table" aria-label="Big days">
      <TableHead>
        <TableRow>
          <TableCell className="big-days-col-rank">#</TableCell>
          <TableCell align="right">Species</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Birder</TableCell>
          <TableCell align="right" className="big-days-col-wide">
            Lists
          </TableCell>
          <TableCell align="right" className="big-days-col-wide">
            Time
          </TableCell>
          <TableCell align="right" className="big-days-col-wide">
            Distance
          </TableCell>
          <TableCell className="big-days-col-wide">Where</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((d) => {
          const isOpen = open === key(d);
          const first = d.checklists[0];
          return (
            <Fragment key={key(d)}>
              <TableRow
                hover
                className={isOpen ? 'big-days-row is-open' : 'big-days-row'}
                onClick={() => setOpen(isOpen ? null : key(d))}
              >
                <TableCell className="big-days-col-rank">{d.rank}</TableCell>
                <TableCell align="right">
                  <strong className="big-days-count">{d.n_species}</strong>
                </TableCell>
                <TableCell>{formatDate(d.date)}</TableCell>
                <TableCell>
                  <span className="big-days-observer">
                    {observerLabel(d.observer_id)}
                  </span>
                  {d.party_size > 1 && (
                    <Tooltip
                      title={`Shared with ${d.party_size - 1} other eBirder${d.party_size > 2 ? 's' : ''}`}
                    >
                      <GroupIcon
                        fontSize="inherit"
                        className="big-days-party-icon"
                      />
                    </Tooltip>
                  )}
                  {!d.solo && d.party_size === 1 && d.observers > 1 && (
                    <Tooltip title={`Party of ${d.observers}`}>
                      <span className="big-days-party-n">×{d.observers}</span>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right" className="big-days-col-wide">
                  {d.n_checklists}
                </TableCell>
                <TableCell align="right" className="big-days-col-wide">
                  {formatMinutes(d.minutes)}
                </TableCell>
                <TableCell align="right" className="big-days-col-wide">
                  {formatKm(d.km)}
                </TableCell>
                <TableCell className="big-days-col-wide big-days-where">
                  {first && (
                    <Link
                      href={checklistUrl(first.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {first.locality}
                    </Link>
                  )}
                  {d.n_localities > 1 && (
                    <span className="big-days-more">
                      {' '}
                      +{d.n_localities - 1} more
                    </span>
                  )}
                </TableCell>
                <TableCell padding="checkbox">
                  <IconButton
                    size="small"
                    aria-label={isOpen ? 'Hide checklists' : 'Show checklists'}
                  >
                    {isOpen ? (
                      <KeyboardArrowUpIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                  </IconButton>
                </TableCell>
              </TableRow>
              {isOpen && (
                <TableRow className="big-days-detail-row">
                  <TableCell colSpan={9}>
                    <DayDetail day={d} dark={dark} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
