import DeleteIcon from '@mui/icons-material/Delete';
import {
  Autocomplete,
  Button,
  Container,
  createFilterOptions,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import React, { useContext, useMemo } from 'react';
import OutlinedCard from '../../Card';
import { CurrentYear } from '../../Chirped';
import { UserSelectionsContext } from '../../contexts/UserSelections';
import { eBirdTaxonomy } from '../../taxonomy/fetch';
import { FadeInWithInitialDelay } from '../FadeWithInitialDelay';
import { TypographyWithFadeIn } from '../Text';

export type QualitativeQuestionData = {
  question: string;
  answer: string;
};
const maxQuestions = 8;

function isQuestionAboutABird(question: string) {
  const birdWords = ['bird', 'species', 'dip'];
  return birdWords.some((word) => question.toLowerCase().includes(word));
}

const QualitativeInput = ({ isActive }: { isActive: boolean }) => {
  const { qualitativeQuestions, setQualitativeQuestions } = useContext(
    UserSelectionsContext
  );

  // parse the taxonomy object and return an object with species code and common name
  const speciesMappingFromTaxonomy = Object.values(eBirdTaxonomy)
    // rank by type: species first, then sub species, then all else
    .sort((a, b) => {
      if (a.category === 'species' && b.category !== 'species') {
        return -1;
      }
      if (a.category !== 'species' && b.category === 'species') {
        return 1;
      }
      if (a.category === 'subspecies' && b.category !== 'subspecies') {
        return -1;
      }
      if (a.category !== 'subspecies' && b.category === 'subspecies') {
        return 1;
      }
      return 0;
    })
    .map((taxon) => ({
      speciesCode: taxon.speciesCode,
      commonName: taxon.commonName,
      scientificName: taxon.scientificName,
      label: taxon.commonName,
      category: taxon.category,
      bandingCodes: taxon.bandingCodes,
    }));

  const questionOptions = useMemo(() => {
    const defaultQuestionOptions = [
      `Favorite bird of ${CurrentYear}`,
      `Nemesis bird of ${CurrentYear}`,
      `Bird you're most excited to see in ${CurrentYear + 1}`,
      'Hardest bird you found this year',
      'Biggest dip of the year',
      'Biggest surprise bird',
      'Favorite birding moment',
      'Rarest bird you found this year',
      'Favorite mixed flock',
      'Favorite new hotpot you found this year',
      'Best birding buddy',
    ];

    return defaultQuestionOptions.filter(
      (option) => !qualitativeQuestions.some((q) => q.question === option)
    );
  }, [qualitativeQuestions]);

  return (
    <OutlinedCard justifyContent="flex-start">
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={250}
        variant="h5"
        sx={{ mb: 2 }}
      >
        Numbers can&apos;t tell even close to the whole story.
      </TypographyWithFadeIn>
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={2000}
        variant="body2"
        sx={{ mb: 2 }}
        textAlign={'left'}
      >
        Here you can add some more personal details to your year. We&apos;ve
        included some suggested questions, but feel free to write your own!
      </TypographyWithFadeIn>
      <Divider sx={{ mb: 2 }} />
      <FadeInWithInitialDelay in={isActive} initialDelay={2750}>
        <Container disableGutters sx={{ width: '100%' }}>
          {qualitativeQuestions.map((data, index) => (
            <FadeInWithInitialDelay key={index} in={isActive} initialDelay={0}>
              <Container disableGutters sx={{ width: '100%' }}>
                <>
                  <Typography
                    variant="body2"
                    sx={{ textAlign: 'left', color: 'text.secondary', mb: 1 }}
                    key={'t-' + index}
                  >
                    Question {index + 1}
                  </Typography>
                  <Autocomplete
                    sx={{ width: '100%', mb: 1 }}
                    freeSolo
                    key={'acq-' + index}
                    options={questionOptions}
                    value={data.question}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        key={'tf-' + index}
                        label="Prompt"
                        slotProps={{
                          input: {
                            ...params.InputProps,
                            type: 'search',
                          },
                        }}
                        value={data.question}
                        onBlur={(e) => {
                          const newData = [...qualitativeQuestions];
                          newData[index].question = e.target.value;
                          setQualitativeQuestions(newData);
                        }}
                      />
                    )}
                  />
                  {/* show species autocomplete if we think the question involves a bird */}
                  {isQuestionAboutABird(data.question) ? (
                    <Autocomplete
                      sx={{ width: '100%', mb: 1 }}
                      freeSolo
                      key={'acb-' + index}
                      options={speciesMappingFromTaxonomy}
                      filterOptions={createFilterOptions({
                        ignoreCase: true,
                        limit: 10,
                        stringify: (option) => Object.values(option).join(' '),
                      })}
                      value={data.answer}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          id={`qd-${index}`}
                          label="Answer"
                          variant="outlined"
                          key={'tf2-' + index}
                          sx={{ mb: 2, width: '100%' }}
                          onBlur={(e) => {
                            const newData = [...qualitativeQuestions];
                            newData[index].answer = e.target.value;
                            setQualitativeQuestions(newData);
                          }}
                        />
                      )}
                    />
                  ) : (
                    <TextField
                      id={`qd-${index}`}
                      label="Answer"
                      variant="outlined"
                      key={'tf2-' + index}
                      sx={{ mb: 2, width: '100%' }}
                      defaultValue={data.answer}
                      onBlur={(e) => {
                        const newData = [...qualitativeQuestions];
                        newData[index].answer = e.target.value;
                        setQualitativeQuestions(newData);
                      }}
                    />
                  )}

                  <Button
                    key={'b-' + index}
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      const newData = [...qualitativeQuestions];
                      newData.splice(index, 1);
                      setQualitativeQuestions(newData);
                    }}
                  >
                    Delete
                  </Button>
                </>
              </Container>
            </FadeInWithInitialDelay>
          ))}

          <br />
          {qualitativeQuestions.length < maxQuestions && (
            <Button
              component="button"
              role={undefined}
              variant="contained"
              tabIndex={-1}
              color="primary"
              onClick={() =>
                setQualitativeQuestions([
                  ...qualitativeQuestions,
                  {
                    question: '',
                    answer: '',
                  },
                ])
              }
            >
              {qualitativeQuestions.length > 0
                ? 'Add another question'
                : 'Add a question'}
            </Button>
          )}
        </Container>
      </FadeInWithInitialDelay>
    </OutlinedCard>
  );
};

export default QualitativeInput;
