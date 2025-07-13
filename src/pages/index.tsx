import React, { type ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageProjects from '@site/src/components/HomepageProjects';
import PhotoGallery from '@site/src/components/PhotoGallery';
import Stats from '@site/src/components/Stats';
import TodoList from '@site/src/components/TodoList';
import CustomFooter from '@site/src/components/CustomFooter';

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}
      noFooter={true}
    >
      <style>{`
        .navbar {
          display: none !important;
        }
        .footer {
          display: none !important;
        }
        body {
          background: var(--ifm-background-color) !important;
        }
        .main-wrapper {
          background: var(--ifm-background-color) !important;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ifm-background-color)',
        }}
      >
        <PhotoGallery />
        <main
          style={{
            flex: 1,
            background: 'var(--ifm-background-color)',
          }}
        >
          <HomepageProjects />
          <Stats />
          <TodoList />
        </main>
        <CustomFooter />
      </div>
    </Layout>
  );
}
