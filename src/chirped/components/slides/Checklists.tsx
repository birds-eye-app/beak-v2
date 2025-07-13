import React, { useContext } from 'react';
import OutlinedCard from '../../Card';
import { ChirpedContext } from '../../contexts/Chirped';
import { TypographyWithFadeIn } from '../Text';

const Checklists = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const yearStats = chirped.yearStats;
  return (
    <OutlinedCard>
      {yearStats.checklistsByType.stationary > 0 && (
        <TypographyWithFadeIn
          in={isActive}
          initialDelay={500}
          variant="body1"
          sx={{ mb: 2, textAlign: 'left' }}
        >
          Some of the time you stuck it out in one spot... logging{' '}
          <b>{yearStats.checklistsByType.stationary.toLocaleString()}</b>{' '}
          stationary checklists.
        </TypographyWithFadeIn>
      )}
      {yearStats.checklistsByType.traveling > 0 && (
        <TypographyWithFadeIn
          in={isActive}
          variant="body1"
          initialDelay={3000}
          sx={{ mb: 2, textAlign: 'left' }}
        >
          {yearStats.checklistsByType.stationary > 0
            ? 'Other times'
            : 'Sometimes'}{' '}
          you were on the move... submitting{' '}
          <b>{yearStats.checklistsByType.traveling.toLocaleString()}</b>{' '}
          traveling checklists and covering{' '}
          <b>{yearStats.totalDistanceKm.toFixed()}</b> km over the year!
        </TypographyWithFadeIn>
      )}
      {yearStats.checklistsByType.incidental > 0 && (
        <TypographyWithFadeIn
          in={isActive}
          initialDelay={6000}
          variant="body1"
          sx={{ mb: 2, textAlign: 'left' }}
        >
          And for the others... well only you can say how you found the birds!
          Here&apos;s to your{' '}
          <b>{yearStats.checklistsByType.incidental.toLocaleString()}</b>{' '}
          incidental checklists, the birds seen on the way to somewhere else,
          the ones you had to say &quot;excuse me a minute, I just heard
          something&quot;, and the cars pulled over to the side of the road to
          get a better look.
        </TypographyWithFadeIn>
      )}
    </OutlinedCard>
  );
};

export default Checklists;
