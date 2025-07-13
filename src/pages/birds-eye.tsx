import React from 'react';
import type {ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';

export default function BirdsEyePage(): ReactNode {
  return (
    <>
      <Head>
        <title>Birds Eye - eBird Mapping Tool</title>
        <meta name="description" content="Interactive map to visualize your eBird life list and discover new birding locations" />
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
          .birds-eye-standalone-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: var(--ifm-background-color, #fff);
            z-index: 9999;
          }
        `}</style>
      </Head>
      <div className="birds-eye-standalone-container">
        <BrowserOnly fallback={<div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'var(--ifm-font-color-base, #000)'
        }}>Loading Birds Eye...</div>}>
          {() => {
            const BirdsEyeThemeWrapper = require('@site/src/components/BirdsEyeThemeWrapper').default;
            return <BirdsEyeThemeWrapper />;
          }}
        </BrowserOnly>
      </div>
    </>
  );
}