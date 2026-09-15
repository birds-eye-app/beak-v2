import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import { useColorMode } from '@docusaurus/theme-common';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { green } from '@mui/material/colors';

// Unlike Chirped / Birds Eye this is a content page, not a full-screen app, so it keeps the
// Docusaurus navbar and lives inside <Layout>. MUI still needs a theme that follows the site's
// light/dark toggle; useColorMode is only valid inside Layout, hence the inner component.
function ThemedBigDays(): ReactNode {
  const { colorMode } = useColorMode();
  const dark = colorMode === 'dark';
  const theme = createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: { main: green[600], light: green[300], dark: green[800] },
      background: {
        default: dark ? '#1b1b1d' : '#fff',
        paper: dark ? '#2d2d30' : '#fff',
      },
    },
    typography: { fontFamily: 'inherit' },
  });
  const [release, setRelease] = useState<string | null>(null);
  useEffect(() => {
    import('@site/src/big-days/api')
      .then((m) => m.fetchMeta())
      .then((meta) => setRelease(meta.release ?? null))
      .catch(() => setRelease(null));
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <BrowserOnly
        fallback={<div style={{ padding: '2rem' }}>Loading Big Days…</div>}
      >
        {() => {
          const { BigDays } = require('@site/src/big-days/BigDays');
          return <BigDays dark={dark} release={release} />;
        }}
      </BrowserOnly>
    </ThemeProvider>
  );
}

export default function BigDaysPage(): ReactNode {
  return (
    <Layout
      title="Big Days"
      description="The biggest single-day species counts in eBird for every country, state and county, with the checklists and routes behind them."
    >
      <Head>
        <meta property="og:title" content="Big Days — eBird records by place" />
      </Head>
      <ThemedBigDays />
    </Layout>
  );
}
