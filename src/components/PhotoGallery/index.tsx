import React, { type ReactNode, useState, useEffect } from 'react';
import styles from './styles.module.css';

const photos = [
  'DSC00327.jpeg',
  'DSC00588.jpeg',
  'DSC01276.jpeg',
  'DSC01387.jpeg',
  'DSC02049.jpeg',
  'DSC03062.jpeg',
  'DSC04238.jpeg',
  'DSC04543.jpeg',
  'DSC05937.jpeg',
  'DSC06606.jpeg',
  'DSC07709.jpeg',
  'DSC07814.jpeg',
  'DSC08239.jpeg',
  'DSC08682.jpeg',
  'DSC08740.jpeg',
];

export default function PhotoGallery(): ReactNode {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 4000); // Change photo every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.gallery}>
      <div className={styles.galleryContainer}>
        <div className={styles.photoWrapper}>
          <img
            src={`/best-photos/${photos[currentIndex]}`}
            alt={`Photo ${currentIndex + 1}`}
            className={styles.photo}
          />
        </div>
      </div>
    </section>
  );
}
