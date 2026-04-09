import { Box, Card, CardContent, Container, Typography } from '@mui/material';
import type { QuizConfig } from './types';

export function QuizSelect({
  quizzes,
  onSelect,
}: {
  quizzes: QuizConfig[];
  onSelect: (quiz: QuizConfig) => void;
}) {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
        Tweeter
      </Typography>
      <Typography
        variant="body2"
        sx={{ mb: 4, textAlign: 'center', color: 'grey.600' }}
      >
        Choose a quiz
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            variant="outlined"
            sx={{
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
              transition: 'border-color 0.2s',
            }}
            onClick={() => onSelect(quiz)}
          >
            <CardContent>
              <Typography variant="h6">{quiz.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {quiz.subtitle} — {quiz.recordings.length} species
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {quiz.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'grey.600' }}>
          Recordings from{' '}
          <a
            href="https://xeno-canto.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            xeno-canto.org
          </a>{' '}
          — CC BY-NC-SA 4.0
        </Typography>
      </Box>
    </Container>
  );
}
