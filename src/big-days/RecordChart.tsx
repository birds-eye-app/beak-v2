import React, { useState } from 'react';
import type { YearRecord } from './api';
import { formatDate } from './format';

type Props = {
  years: YearRecord[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
};

/**
 * The record progression: the best day of each year as a bar, with the all-time record
 * highlighted. Plain SVG — no chart library for one bar chart. Clicking a bar filters the
 * leaderboard to that year; clicking it again clears the filter.
 */
export function RecordChart({ years, selectedYear, onSelectYear }: Props) {
  const [hover, setHover] = useState<YearRecord | null>(null);
  const shown = years.filter((y) => y.best > 0);
  if (shown.length < 2) return null;

  const width = 720;
  const height = 160;
  const padL = 34;
  const padB = 22;
  const padT = 8;
  const innerW = width - padL - 24;
  const innerH = height - padB - padT;
  const first = shown[0].year;
  const last = shown[shown.length - 1].year;
  const span = Math.max(1, last - first + 1);
  const barW = Math.max(2, Math.floor(innerW / span) - 1);
  const maxBest = Math.max(...shown.map((y) => y.best));
  const record = shown.reduce((a, b) => (b.best > a.best ? b : a), shown[0]);
  const x = (year: number) => padL + ((year - first) / span) * innerW;
  const y = (v: number) => padT + innerH - (v / maxBest) * innerH;

  // Axis ticks: every 10 years for long spans, 5 for medium, every year for short.
  const step = span > 60 ? 10 : span > 20 ? 5 : 1;
  const ticks: number[] = [];
  for (let t = Math.ceil(first / step) * step; t <= last; t += step)
    ticks.push(t);

  const tip = hover ?? record;
  return (
    <div className="big-days-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Best big day per year"
      >
        {[0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1={padL}
              x2={width - 24}
              y1={y(maxBest * f)}
              y2={y(maxBest * f)}
              className="big-days-chart-grid"
            />
            <text
              x={padL - 4}
              y={y(maxBest * f) + 4}
              textAnchor="end"
              className="big-days-chart-label"
            >
              {Math.round(maxBest * f)}
            </text>
          </g>
        ))}
        {shown.map((r) => {
          const selected = selectedYear === r.year;
          const cls = [
            'big-days-chart-bar',
            r.year === record.year ? 'is-record' : '',
            selected ? 'is-selected' : '',
            selectedYear && !selected ? 'is-dimmed' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <rect
              key={r.year}
              x={x(r.year)}
              y={y(r.best)}
              width={barW}
              height={Math.max(1, padT + innerH - y(r.best))}
              className={cls}
              onMouseEnter={() => setHover(r)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectYear(selected ? null : r.year)}
            >
              <title>{`${r.year}: ${r.best} species`}</title>
            </rect>
          );
        })}
        {ticks.map((t) => (
          <text
            key={t}
            x={x(t) + barW / 2}
            y={height - 6}
            textAnchor="middle"
            className="big-days-chart-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div className="big-days-chart-caption">
        {hover ? (
          <>
            <strong>{tip.year}</strong>: {tip.best} species on{' '}
            {formatDate(tip.best_date)}
            {tip.days
              ? ` · ${tip.days.toLocaleString('en-US')} birder-days that year`
              : ''}
          </>
        ) : (
          <>
            Best day each year. The record, <strong>{record.best}</strong> on{' '}
            {formatDate(record.best_date)}, is highlighted; click a bar to show
            that year.
          </>
        )}
      </div>
    </div>
  );
}
