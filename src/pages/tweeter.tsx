import React from 'react';
import type { ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';

export default function TweeterPage(): ReactNode {
  return (
    <>
      <Head>
        <title>Tweeter - Bird Song Quiz</title>
        <meta
          name="description"
          content="Test your bird song identification skills"
        />
        <style>{`
          .navbar,
          .footer,
          .main-wrapper > .container {
            display: none !important;
          }

          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }

          .tweeter-standalone-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            overflow-y: auto;
            z-index: 9999;
          }

          /* MUI poppers (autocomplete dropdown) need to be above the container */
          .MuiAutocomplete-popper {
            z-index: 10000 !important;
          }
        `}</style>
      </Head>
      <div className="tweeter-standalone-container">
        <BrowserOnly
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
              }}
            >
              Loading Tweeter...
            </div>
          }
        >
          {() => {
            const TweeterThemeWrapper =
              require('@site/src/components/TweeterThemeWrapper').default;
            return <TweeterThemeWrapper />;
          }}
        </BrowserOnly>
      </div>
    </>
  );
}
