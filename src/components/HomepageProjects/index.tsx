import React, {type ReactNode, useCallback} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type ProjectItem = {
  title: string;
  mediaType: 'video' | 'image';
  mediaSrc: string;
  description: ReactNode;
  link: string;
};

const ProjectList: ProjectItem[] = [
  {
    title: 'Chirped',
    mediaType: 'video',
    mediaSrc: '/img/chirped.mp4',
    description: (
      <>
        Spotify "Wrapped" like tool for birders that uses your eBird data to 
        show fun statistics and insights about your birding from 2024.
      </>
    ),
    link: '/chirped',
  },
  {
    title: 'Birds Eye',
    mediaType: 'video',
    mediaSrc: '/img/birds-eye-demo.mp4',
    description: (
      <>
        Mapbox-powered geographic visualization tool for eBird sightings
        showing you where you added historical lifers and where you can find new ones.
      </>
    ),
    link: '/birds-eye',
  },
  {
    title: 'Blog',
    mediaType: 'image',
    mediaSrc: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Personal blog with posts about birding, technology, and more
      </>
    ),
    link: '/blog',
  },
];

function Project({title, mediaType, mediaSrc, description, link}: ProjectItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Link to={link} className={styles.projectLink}>
          {mediaType === 'video' ? (
            <video autoPlay
              className={styles.projectMedia}
              muted={true}
              loop
              playsInline
              preload="metadata"
              controls={false}
            >
              <source src={mediaSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              className={styles.projectMedia}
              src={mediaSrc}
              alt={`${title} preview`}
            />
          )}
        </Link>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">
          <Link to={link} className={styles.projectTitle}>
            {title}
          </Link>
        </Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageProjects(): ReactNode {
  return (
    <section className={styles.projects}>
      <div className="container">
        <div className="text--center margin-bottom--lg">
          <Heading as="h2">Projects</Heading>
        </div>
        <div className="row">
          {ProjectList.map((props, idx) => (
            <Project key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}