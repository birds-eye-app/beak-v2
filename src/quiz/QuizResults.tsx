import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import type { QuizAnswer } from './types';

export function QuizResults({
  answers,
  onPlayAgain,
  onReplayMissed,
  onBack,
}: {
  answers: QuizAnswer[];
  onPlayAgain: () => void;
  onReplayMissed?: () => void;
  onBack?: () => void;
}) {
  const score = answers.filter((a) => a.correct).length;
  const missedCount = answers.filter((a) => !a.correct).length;
  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h4" sx={{ mb: 0.5, textAlign: 'center' }}>
          {totalPoints} pts
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 1, textAlign: 'center' }}
        >
          {score} / {answers.length} correct
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          {score === answers.length
            ? 'Perfect score!'
            : score >= answers.length * 0.7
              ? 'Nice work!'
              : 'Keep practicing!'}
        </Typography>

        <List dense>
          {answers.map((answer, i) => (
            <ListItem key={i}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {answer.correct ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : answer.skipped ? (
                  <HelpOutlineIcon color="warning" fontSize="small" />
                ) : (
                  <CancelIcon color="error" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={answer.actual}
                secondary={
                  answer.correct
                    ? `${answer.elapsedSeconds.toFixed(1)}s`
                    : answer.skipped
                      ? 'Skipped'
                      : `You guessed: ${answer.guessed}`
                }
              />
              {answer.points > 0 && (
                <Typography variant="body2" color="primary" sx={{ ml: 1 }}>
                  +{answer.points}
                </Typography>
              )}
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button variant="contained" onClick={onPlayAgain}>
            New Round
          </Button>
          {onReplayMissed && missedCount > 0 && (
            <Button variant="outlined" onClick={onReplayMissed}>
              Review Missed ({missedCount})
            </Button>
          )}
          {onBack && (
            <Button variant="text" onClick={onBack}>
              All Quizzes
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
