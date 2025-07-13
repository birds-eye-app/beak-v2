import React from 'react';
import type {ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';

export default function ChirpedPage(): ReactNode {
  return (
    <>
      <Head>
        <title>Chirped - eBird Data Analysis</title>
        <meta name="description" content="Upload your eBird data to get insights about your birding activities" />
        <style>{`
          /* Hide Docusaurus elements for standalone experience */
          .navbar,
          .footer,
          .main-wrapper > .container {
            display: none !important;
          }
          
          /* Make the page full screen */
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          
          /* Full screen container */
          .chirped-standalone-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--chirped-bg-color, #eee);
            z-index: 9999;
          }
        `}</style>
      </Head>
      <div className="chirped-standalone-container">
        <BrowserOnly fallback={<div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--chirped-text-color, #000)'
        }}>Loading Chirped...</div>}>
          {() => {
            const ChirpedThemeWrapper = require('@site/src/components/ChirpedThemeWrapper').default;
            return <ChirpedThemeWrapper />;
          }}
        </BrowserOnly>
      </div>
    </>
  );
}