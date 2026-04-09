import React from 'react';
import type { ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';

export default function TweeterAdminPage(): ReactNode {
  return (
    <>
      <Head>
        <title>Tweeter Admin</title>
        <style>{`
          .navbar,
          .footer,
          .main-wrapper > .container {
            display: none !important;
          }

          .tweeter-admin-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            overflow-y: auto;
            z-index: 9999;
          }
        `}</style>
      </Head>
      <div className="tweeter-admin-container">
        <BrowserOnly
          fallback={<div style={{ padding: 40 }}>Loading Admin...</div>}
        >
          {() => {
            const TweeterAdminWrapper =
              require('@site/src/components/TweeterAdminWrapper').default;
            return <TweeterAdminWrapper />;
          }}
        </BrowserOnly>
      </div>
    </>
  );
}
