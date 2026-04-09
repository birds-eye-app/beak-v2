import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { QuizCard } from './QuizCard';
import { QuizResults } from './QuizResults';
import {
  calculatePoints,
  type QuizAnswer,
  type QuizConfig,
  type RecordingManifest,
} from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Quiz({
  config,
  onBack,
}: {
  config: QuizConfig;
  onBack: () => void;
}) {
  const [round, setRound] = useState(0);
  const [isReplayRound, setIsReplayRound] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';
  const DEV_QUESTION_LIMIT = 5;

  const questions: RecordingManifest[] = useMemo(() => {
    const shuffled = shuffle(config.recordings);
    const limit = config.questionsPerRound ?? (isDev ? DEV_QUESTION_LIMIT : 0);
    return limit > 0 ? shuffled.slice(0, limit) : shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, config, isDev]);

  const [replayQuestions, setReplayQuestions] = useState<RecordingManifest[]>(
    []
  );

  const activeQuestions = isReplayRound ? replayQuestions : questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const totalScore = answers.reduce((sum, a) => sum + a.points, 0);

  const handleAnswer = useCallback(
    (guessed: string, correct: boolean, elapsedSeconds: number) => {
      const recording = activeQuestions[currentIndex];
      const points = correct
        ? calculatePoints(elapsedSeconds, recording.difficulty)
        : 0;
      setAnswers((prev) => [
        ...prev,
        {
          correct,
          guessed,
          actual: recording.commonName,
          recording,
          points,
          elapsedSeconds,
        },
      ]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, activeQuestions]
  );

  const handleSkip = useCallback(() => {
    const recording = activeQuestions[currentIndex];
    setAnswers((prev) => [
      ...prev,
      {
        correct: false,
        guessed: '',
        actual: recording.commonName,
        skipped: true,
        recording,
        points: 0,
        elapsedSeconds: 0,
      },
    ]);
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, activeQuestions]);

  const handleReject = useCallback(
    async (xenoCantoId: string) => {
      fetch('/api/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xenoCantoId }),
      }).catch(() => {});
      const recording = activeQuestions[currentIndex];
      setAnswers((prev) => [
        ...prev,
        {
          correct: false,
          guessed: '(rejected)',
          actual: recording.commonName,
          recording,
          points: 0,
          elapsedSeconds: 0,
        },
      ]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, activeQuestions]
  );

  const handlePlayAgain = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setIsReplayRound(false);
    setRound((r) => r + 1);
  }, []);

  const handleReplayMissed = useCallback(() => {
    const missed = answers.filter((a) => !a.correct).map((a) => a.recording);
    setReplayQuestions(shuffle(missed));
    setCurrentIndex(0);
    setAnswers([]);
    setIsReplayRound(true);
  }, [answers]);

  const done = currentIndex >= activeQuestions.length;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">{config.title}</Typography>
        </Box>
        {answers.length > 0 && !done && (
          <Typography variant="h6" color="primary">
            {totalScore} pts
          </Typography>
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{ mb: 1, textAlign: 'center', color: 'grey.600' }}
      >
        {config.subtitle}
        {isReplayRound && ' (Review)'}
      </Typography>
      <Typography
        variant="caption"
        sx={{ mb: 3, display: 'block', textAlign: 'center', color: 'grey.500' }}
      >
        Some recordings may have multiple species in the background — focus on
        the one clear primary species.
      </Typography>

      {done ? (
        <QuizResults
          answers={answers}
          onPlayAgain={handlePlayAgain}
          onReplayMissed={handleReplayMissed}
          onBack={onBack}
        />
      ) : (
        <QuizCard
          key={`${round}-${isReplayRound}-${currentIndex}`}
          recording={activeQuestions[currentIndex]}
          allRecordings={config.recordings}
          questionNumber={currentIndex + 1}
          totalQuestions={activeQuestions.length}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onReject={handleReject}
          autoPlay={currentIndex > 0}
        />
      )}

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
