import React from 'react';
import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function ChirpedPage(): ReactNode {
  return (
    <Layout
      title="Chirped - eBird Data Analysis"
      description="Upload your eBird data to get insights about your birding activities">
      <div style={{ padding: '20px', minHeight: '100vh' }}>
        <BrowserOnly fallback={<div>Loading Chirped...</div>}>
          {() => {
            const ChirpedThemeWrapper = require('@site/src/components/ChirpedThemeWrapper').default;
            return <ChirpedThemeWrapper />;
          }}
        </BrowserOnly>
      </div>
    </Layout>
  );
}