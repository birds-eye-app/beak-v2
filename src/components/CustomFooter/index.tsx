import React, { type ReactNode } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

function ThemeToggle(): ReactNode {
  const { useColorMode } = require('@docusaurus/theme-common');
  const { colorMode, setColorMode } = useColorMode();

  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={styles.themeToggle}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="currentColor"
        width="16"
        height="16"
      >
        <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM12 4c-0.6 0-1-0.4-1-1V1c0-0.6 0.4-1 1-1s1 0.4 1 1v2c0 0.6-0.4 1-1 1zM12 24c-0.6 0-1-0.4-1-1v-2c0-0.6 0.4-1 1-1s1 0.4 1 1v2c0 0.6-0.4 1-1 1zM5.6 6.6c-0.3 0-0.6-0.1-0.7-0.3L3.5 4.9c-0.4-0.4-0.4-1 0-1.4s1-0.4 1.4 0L6.3 4.9c0.4 0.4 0.4 1 0 1.4-0.2 0.2-0.4 0.3-0.7 0.3zM19.8 20.8c-0.3 0-0.6-0.1-0.7-0.3L17.7 19.1c-0.4-0.4-0.4-1 0-1.4s1-0.4 1.4 0l1.4 1.4c0.4 0.4 0.4 1 0 1.4-0.2 0.2-0.4 0.3-0.7 0.3zM3 13H1c-0.6 0-1-0.4-1-1s0.4-1 1-1h2c0.6 0 1 0.4 1 1s-0.4 1-1 1zM23 13h-2c-0.6 0-1-0.4-1-1s0.4-1 1-1h2c0.6 0 1 0.4 1 1s-0.4 1-1 1zM4.2 20.8c-0.3 0-0.6-0.1-0.7-0.3-0.4-0.4-0.4-1 0-1.4L4.9 17.7c0.4-0.4 1-0.4 1.4 0s0.4 1 0 1.4L4.9 20.5c-0.2 0.2-0.4 0.3-0.7 0.3zM18.4 6.6c-0.3 0-0.6-0.1-0.7-0.3-0.4-0.4-0.4-1 0-1.4L19.1 3.5c0.4-0.4 1-0.4 1.4 0s0.4 1 0 1.4L19.1 6.3c-0.2 0.2-0.4 0.3-0.7 0.3z" />
      </svg>

      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={colorMode === 'dark'}
          onChange={toggleColorMode}
          aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
        />
        <span className={styles.slider}></span>
      </label>

      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="currentColor"
        width="16"
        height="16"
      >
        <path d="M21.4 13.7C20.2 14.4 18.8 14.8 17.3 14.8c-3.9 0-7.1-3.2-7.1-7.1c0-1.5 0.4-2.9 1.1-4.1c-3.1 0.5-5.5 3.2-5.5 6.5c0 3.6 2.9 6.5 6.5 6.5c3.3 0 6.1-2.4 6.6-5.5C21.6 12.4 21.5 13.1 21.4 13.7z" />
      </svg>
    </div>
  );
}

export default function CustomFooter(): ReactNode {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.links}>
          <a
            href="https://github.com/birds-eye-app/beak-v2"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="View source code on GitHub"
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>

          <a
            href="https://instagram.com/dtmeadows"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="Follow on Instagram"
          >
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Instagram
          </a>

          <BrowserOnly fallback={<div>Loading...</div>}>
            {() => <ThemeToggle />}
          </BrowserOnly>
        </div>
      </div>
    </footer>
  );
}
