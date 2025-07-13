import React, { useState, useEffect, type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import {
  parseObservations,
  Observation,
} from '@site/src/chirped/parseEbirdExport';
import { calculateLifeList } from '@site/src/chirped/calculate';
import { subDays, isAfter } from 'date-fns';

interface TripReport {
  id: string;
  title: string;
  url: string;
  dates: string;
  species: number;
  lifers: number;
}

const tripReports: TripReport[] = [
  {
    id: '394205',
    title: 'Baja California 2025',
    url: 'https://ebird.org/tripreport/394205',
    dates: 'Jul 5-12 2025',
    species: 41,
    lifers: 14,
  },
  {
    id: '353860',
    title: 'Colombia 2025',
    url: 'https://ebird.org/tripreport/353860',
    dates: 'Apr 8-15 2025',
    species: 156,
    lifers: 91,
  },
  {
    id: '343583',
    title: 'Martha’s Vineyard: March 2025',
    url: 'https://ebird.org/tripreport/343583',
    dates: 'Mar 15-22 2025',
    species: 62,
    lifers: 0,
  },
  {
    id: '330810',
    title: 'Adirondacks, there and back again',
    url: 'https://ebird.org/tripreport/330810',
    dates: 'Feb 8-13 2025',
    species: 22,
    lifers: 3,
  },
];

function StatsContent(): ReactNode {
  const [recentLifers, setRecentLifers] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLifers() {
      try {
        // Load and parse eBird data
        const response = await fetch('/MyEBirdData.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch eBird data');
        }
        const csvText = await response.text();
        const observations = await parseObservations(csvText);

        // Calculate life list to get first occurrences
        const currentYear = new Date().getFullYear();
        const lifeList = calculateLifeList(observations, currentYear);

        // Find recent lifers (within last 90 days)
        const ninetyDaysAgo = subDays(new Date(), 90);
        const recent = Object.values(lifeList)
          .filter((obs) => isAfter(obs.dateTime, ninetyDaysAgo))
          .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())
          .slice(0, 5); // Show top 5 recent lifers

        setRecentLifers(recent);
      } catch (err) {
        console.error('Error loading lifers:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadLifers();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: 'var(--ifm-color-emphasis-100)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <h3
            style={{ margin: '0 0 1rem 0', color: 'var(--ifm-color-primary)' }}
          >
            Recent Lifers
          </h3>
          <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>Loading...</p>
        </div>
        <div
          style={{
            background: 'var(--ifm-color-emphasis-100)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <h3
            style={{ margin: '0 0 1rem 0', color: 'var(--ifm-color-primary)' }}
          >
            Recent Trip Reports
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tripReports.map((report) => (
              <li
                key={report.id}
                style={{
                  padding: '1rem 0',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Link
                      to={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--ifm-font-color-base)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        display: 'block',
                        marginBottom: '0.5rem',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-font-color-base)';
                      }}
                    >
                      {report.title}
                    </Link>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--ifm-color-emphasis-600)',
                        display: 'flex',
                        gap: '1rem',
                      }}
                    >
                      <span>{report.species} species</span>
                      {report.lifers > 0 && <span>{report.lifers} lifers</span>}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--ifm-color-emphasis-600)',
                      marginLeft: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    {report.dates}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: 'var(--ifm-color-emphasis-100)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--ifm-color-primary)' }}>
          Recent Lifers
        </h3>
        {error ? (
          <p style={{ color: 'var(--ifm-color-danger)', fontStyle: 'italic' }}>
            Error loading lifers: {error}
          </p>
        ) : recentLifers.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentLifers.map((lifer, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                    <Link
                      to={`https://ebird.org/species/${lifer.taxonomy.speciesCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--ifm-font-color-base)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-font-color-base)';
                      }}
                    >
                      {lifer.taxonomy.commonName}
                    </Link>
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ifm-color-emphasis-600)',
                      lineHeight: 1.2,
                    }}
                  >
                    <Link
                      to={`https://ebird.org/hotspot/${lifer.locationId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--ifm-color-emphasis-600)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          'var(--ifm-color-emphasis-600)';
                      }}
                    >
                      {lifer.location}
                    </Link>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--ifm-color-emphasis-600)',
                    marginLeft: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {lifer.dateTime.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p
            style={{
              color: 'var(--ifm-color-emphasis-600)',
              fontStyle: 'italic',
            }}
          >
            No recent lifers in the last 90 days
          </p>
        )}
      </div>

      <div
        style={{
          background: 'var(--ifm-color-emphasis-100)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--ifm-color-primary)' }}>
          Recent Trip Reports
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {tripReports.map((report) => (
            <li
              key={report.id}
              style={{
                padding: '1rem 0',
                borderBottom: '1px solid var(--ifm-color-emphasis-200)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Link
                    to={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--ifm-font-color-base)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: '0.5rem',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--ifm-color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        'var(--ifm-font-color-base)';
                    }}
                  >
                    {report.title}
                  </Link>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ifm-color-emphasis-600)',
                      display: 'flex',
                      gap: '1rem',
                    }}
                  >
                    <span>{report.species} species</span>
                    {report.lifers > 0 && <span>{report.lifers} lifers</span>}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--ifm-color-emphasis-600)',
                    marginLeft: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {report.dates}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Stats(): ReactNode {
  return (
    <section
      style={{ padding: '4rem 0', background: 'var(--ifm-background-color)' }}
    >
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2">Recent Birding Activity</Heading>
        </div>
        <BrowserOnly>{() => <StatsContent />}</BrowserOnly>
      </div>
    </section>
  );
}
