import { Share } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItem,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import List from '@mui/material/List';
import React, { useContext, useRef, useState } from 'react';
import OutlinedCard from '../../Card';
import { CurrentYear } from '../../Chirped';
import { ChirpedContext } from '../../contexts/Chirped';
import { UserSelectionsContext } from '../../contexts/UserSelections';
import { shareComponent } from '../../sharing';
import { FadeInWithInitialDelay } from '../FadeWithInitialDelay';

const BigNumberWithLabelBelow = ({
  number,
  label,
}: {
  number: number;
  label: string;
}) => (
  <Container disableGutters sx={{ textAlign: 'center' }}>
    <Typography variant="h5">{number.toLocaleString()}</Typography>
    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
  </Container>
);

export const GutterLessContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => <Container disableGutters>{children}</Container>;

export const ShareButton = ({
  shareRef,
  fileName,
}: {
  shareRef: React.RefObject<HTMLDivElement>;
  fileName: string;
}) => {
  const [shareSuccessful, setShareSuccessful] = useState<boolean | null>(null);

  return (
    <Container
      disableGutters
      // floating footer button
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'fixed',
        bottom: 20,
        zIndex: 3,
      }}
    >
      {shareSuccessful !== null && (
        <Alert severity={shareSuccessful ? 'success' : 'error'} sx={{ mb: 2 }}>
          {shareSuccessful
            ? 'Successfully shared!'
            : 'Failed to share. Maybe try taking a screenshot of this page instead.'}
        </Alert>
      )}
      <Button
        variant="contained"
        startIcon={<Share />}
        onClick={async () => {
          setShareSuccessful(await shareComponent(shareRef.current!, fileName));
          // reset the success message after a few seconds
          setTimeout(() => setShareSuccessful(null), 5000);
        }}
      >
        Share
      </Button>
    </Container>
  );
};

const Summary = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const { qualitativeQuestions } = useContext(UserSelectionsContext);

  const yearStats = chirped.yearStats;
  const { hotspotRanking } = useContext(UserSelectionsContext);
  const shareRef = useRef<HTMLDivElement>(null);
  const [showBreakdownBy, setShowBreakdownBy] = useState<
    'data' | 'qualitative'
  >('data');

  const topHotspots =
    hotspotRanking === 'checklists'
      ? chirped.rankings.topHotspotsByChecklists
      : chirped.rankings.topHotspotsByTimeSpent;

  // ignore any with blank questions or answers
  const questionsToShow = qualitativeQuestions
    .filter((question) => question.question.trim() && question.answer.trim())
    .slice(0, 8);

  return (
    <Container
      disableGutters
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overFlowY: 'auto',
      }}
    >
      <Container
        disableGutters
        sx={{ padding: 0, position: 'fixed', top: 20, zIndex: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: 50,
          }}
        >
          <Card sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 1,
                maxHeight: 30,
                marginBottom: -2,
                paddingRight: 0,
              }}
            >
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <FormLabel
                  sx={{ marginRight: 2 }}
                  id="view-by-radio-group-label"
                >
                  Show:{' '}
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="view-by-radio-group-label"
                  name="view-by-radio-group"
                  value={showBreakdownBy}
                  onChange={(e) =>
                    setShowBreakdownBy(e.target.value as 'data' | 'qualitative')
                  }
                >
                  <FormControlLabel
                    value="data"
                    control={<Radio size="small" />}
                    label="Top 5"
                  />
                  <FormControlLabel
                    value="qualitative"
                    control={<Radio size="small" />}
                    label="Qualitative"
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Box>
      </Container>
      <OutlinedCard
        justifyContent="flex-start"
        ref={shareRef}
        disableScroll
        maxHeight={800}
        minHeight={1}
      >
        <FadeInWithInitialDelay in={isActive} initialDelay={500}>
          <Container>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Chirped {CurrentYear}
            </Typography>
            <Container
              disableGutters
              sx={{ display: 'flex', flexDirection: 'row' }}
            >
              <BigNumberWithLabelBelow
                number={yearStats.species}
                label="Species"
              />
              <BigNumberWithLabelBelow
                number={chirped.lifeList.length - yearStats.newLifersCount}
                label="New lifers"
              />
              <BigNumberWithLabelBelow
                number={yearStats.totalTimeSpentMinutes}
                label="Minutes"
              />
            </Container>
            <Container
              disableGutters
              sx={{ display: 'flex', flexDirection: 'row' }}
            >
              <BigNumberWithLabelBelow
                number={yearStats.checklists}
                label="Checklists"
              />
              <BigNumberWithLabelBelow
                number={yearStats.numberOfHotspots}
                label="Hotspots"
              />
              <BigNumberWithLabelBelow
                number={parseInt(yearStats.totalDistanceKm.toFixed())}
                label="Kilometers"
              />
            </Container>
            <br />
            {showBreakdownBy === 'data' && (
              <FadeInWithInitialDelay in={isActive} initialDelay={0}>
                <Container
                  disableGutters
                  sx={{
                    width: '100%',
                    maxHeight: 400,
                    display: 'flex',
                    flexDirection: 'row',
                    overflow: 'hidden',
                  }}
                >
                  <Container disableGutters sx={{ flex: 1, padding: 0 }}>
                    <Typography gutterBottom variant="body1">
                      Top species
                    </Typography>
                    <Container
                      disableGutters
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                      }}
                    >
                      <List component="ol">
                        {chirped.rankings.mostObservedByChecklistFrequency
                          .slice(0, 5)
                          .map((species, index) => (
                            <ListItem
                              disableGutters
                              disablePadding
                              key={species.species}
                            >
                              <Container
                                disableGutters
                                sx={{ flexDirection: 'row', display: 'flex' }}
                              >
                                <Typography
                                  variant="body2"
                                  fontSize={12}
                                  sx={{
                                    marginRight: 1,
                                  }}
                                >
                                  {index + 1}.{' '}
                                </Typography>
                                <Typography fontSize={12} variant="body2">
                                  {species.species}
                                </Typography>
                              </Container>
                            </ListItem>
                          ))}
                      </List>
                    </Container>
                  </Container>
                  <Container disableGutters sx={{ flex: 1 }}>
                    <Typography gutterBottom variant="body1">
                      Top Hotspots
                    </Typography>
                    <Container
                      disableGutters
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                      }}
                    >
                      <List component="ol">
                        {topHotspots.slice(0, 5).map((hotspot, index) => (
                          <ListItem
                            disableGutters
                            disablePadding
                            key={hotspot.locationID}
                          >
                            <Container
                              disableGutters
                              sx={{ flexDirection: 'row', display: 'flex' }}
                            >
                              <Typography
                                variant="body2"
                                fontSize={12}
                                sx={{
                                  marginRight: 1,
                                }}
                              >
                                {index + 1}.{' '}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontSize={12}
                                sx={{
                                  maxHeight: 100,
                                  overflow: 'hidden',
                                }}
                              >
                                {hotspot.locationName}
                              </Typography>
                            </Container>
                          </ListItem>
                        ))}
                      </List>
                    </Container>
                  </Container>
                </Container>
              </FadeInWithInitialDelay>
            )}
            {showBreakdownBy === 'qualitative' && (
              <FadeInWithInitialDelay in={isActive} initialDelay={0}>
                <Container
                  disableGutters
                  sx={{
                    width: '100%',
                    maxHeight: '40%',
                    display: 'flex',
                    overflow: 'hidden',
                  }}
                >
                  <TableContainer component={GutterLessContainer}>
                    <Table size="small" aria-label="simple table">
                      <TableBody>
                        {questionsToShow.map((row, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell width={'50%'} component="th" scope="row">
                              {row.question}
                            </TableCell>
                            <TableCell width={'50%'} align="right">
                              {row.answer}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Container>
              </FadeInWithInitialDelay>
            )}
            <Typography color="success" sx={{ mt: 1, color: 'warning' }}>
              {'dtmeadows.me/chirped'}
            </Typography>
          </Container>
        </FadeInWithInitialDelay>
      </OutlinedCard>
      <ShareButton shareRef={shareRef} fileName="chirped-summary.png" />
    </Container>
  );
};

export default Summary;
