import Typography from '@mui/material/Typography';
import React, { useContext } from 'react';
import OutlinedCard from '../../Card';
import { ChirpedContext } from '../../contexts/Chirped';
import List from '@mui/material/List';
import { Container, ListItem } from '@mui/material';
import { TypographyWithFadeIn } from '../Text';
import { FadeInWithInitialDelay } from '../FadeWithInitialDelay';

const Counts = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const yearStats = chirped.yearStats;
  return (
    <OutlinedCard justifyContent="flex-start">
      <TypographyWithFadeIn initialDelay={500} in={isActive} variant="body1">
        Sometimes it&apos;s not just about adding species to the list...
      </TypographyWithFadeIn>
      <TypographyWithFadeIn initialDelay={2000} in={isActive} variant="body1">
        {' '}
        It&apos;s also about counting the birds (and sometimes estimating)!
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn initialDelay={3750} in={isActive} variant="h5">
        {' '}
        You counted a total of{' '}
        <b>{yearStats.totalBirdsCounted.toLocaleString()}</b> birds this year
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn initialDelay={5750} in={isActive} variant="body2">
        {' '}
        (If you&apos;re curious, that&apos;s an average of about{' '}
        <b>
          {(
            yearStats.totalBirdsCounted / yearStats.totalTimeSpentMinutes
          ).toFixed(2)}
        </b>{' '}
        birds per minute)
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn
        initialDelay={7500}
        in={isActive}
        variant="body2"
        sx={{ mb: 2 }}
      >
        {' '}
        Here are the birds that topped the counts for the year:
      </TypographyWithFadeIn>
      <Container
        disableGutters
        sx={{
          width: '100%',
          maxHeight: 150,
          overflowY: 'auto',
        }}
      >
        <FadeInWithInitialDelay in={isActive} initialDelay={8750}>
          <List component="ol">
            {chirped.rankings.mostObservedByTotalCount.map((species, index) => (
              <ListItem disableGutters disablePadding key={species.species}>
                <Container
                  disableGutters
                  sx={{ flexDirection: 'row', display: 'flex' }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      marginRight: 1,
                    }}
                  >
                    {index + 1}.{' '}
                  </Typography>
                  <Typography variant="body2">{species.species}</Typography>
                  <Container sx={{ flex: 1 }} />
                  <Typography variant="body2">
                    {species.totalCounts.toLocaleString()}
                  </Typography>
                </Container>
              </ListItem>
            ))}
          </List>
        </FadeInWithInitialDelay>
      </Container>
    </OutlinedCard>
  );
};

export default Counts;
