import React, { useContext } from 'react';
import OutlinedCard from '../../Card';
import { CurrentYear } from '../../Chirped';
import { ChirpedContext } from '../../contexts/Chirped';
import { TypographyWithFadeIn } from '../Text';

const Lifers = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const yearStats = chirped.yearStats;
  return (
    <OutlinedCard>
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={500}
        variant="body1"
        sx={{ mb: 2 }}
      >
        You started the year with{' '}
        <b>{chirped.lifeList.length - yearStats.newLifersCount}</b> birds on
        your life list.
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn
        in={isActive}
        variant="h5"
        initialDelay={2000}
        sx={{ mb: 1, textAlign: 'left' }}
      >
        You added <b>{yearStats.newLifersCount}</b> new birds to your life list
        in {CurrentYear}...
      </TypographyWithFadeIn>
      <TypographyWithFadeIn
        in={isActive}
        variant="h5"
        initialDelay={3500}
        sx={{ mb: 1, textAlign: 'right' }}
      >
        ... which means your total life list is now{' '}
        <b>{chirped.lifeList.length}!</b>
      </TypographyWithFadeIn>
      <br />
      <br />
      <TypographyWithFadeIn
        in={isActive}
        variant="body1"
        initialDelay={5500}
        sx={{ mb: 1, textAlign: 'left' }}
      >
        Let&apos;s take a closer look at those species...
      </TypographyWithFadeIn>
    </OutlinedCard>
  );
};

export default Lifers;
