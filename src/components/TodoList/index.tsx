import React, {type ReactNode} from 'react';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const todos = [
  'fix bugs with dark mode like the dark mode icon not being an anatomically correct moon and the blog posts not really looking, well, dark.',
  'make the gallery fade between images rather than just swapping directly',
  'stop using the docusaurus image for the blog.',
  'fix so many things with the blog: remove the janky header, stop tagging things with nonsense, actually put up your own content you lazy man'
];

export default function TodoList(): ReactNode {
  return (
    <section style={{ padding: '4rem 0', background: 'var(--ifm-background-color)' }}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2">Todo</Heading>
        </div>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {todos.map((todo, idx) => (
              <li key={idx} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                background: 'var(--ifm-color-emphasis-100)', 
                borderRadius: '8px',
                borderLeft: '4px solid var(--ifm-color-primary)'
              }}>
                <div style={{ 
                  marginRight: '1rem', 
                  color: 'var(--ifm-color-primary)', 
                  marginTop: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect 
                      x="2" 
                      y="2" 
                      width="16" 
                      height="16" 
                      rx="3" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <span style={{ flex: 1, lineHeight: 1.5, color: 'var(--ifm-font-color-base)' }}>{todo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}