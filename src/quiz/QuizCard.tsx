import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "./AudioPlayer";
import { SpeciesAutocomplete } from "./SpeciesAutocomplete";
import {
  calculatePoints,
  DIFFICULTY_MULTIPLIER,
  type RecordingManifest,
} from "./types";

const AUTO_ADVANCE_MS = 3000;
const isDev = process.env.NODE_ENV === 'development';

const DIFFICULTY_COLOR = {
  easy: "success",
  medium: "warning",
  hard: "error",
} as const;

export function QuizCard({
  recording,
  questionNumber,
  totalQuestions,
  onAnswer,
  onSkip,
  onReject,
  autoPlay = true,
}: {
  recording: RecordingManifest;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (guessed: string, correct: boolean, elapsedSeconds: number) => void;
  onSkip?: () => void;
  onReject?: (xenoCantoId: string) => void;
  autoPlay?: boolean;
}) {
  const [guess, setGuess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const advanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer: tracks elapsed time, pauses when audio is paused
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (audioPlaying && !submitted) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - (lastTickRef.current ?? now);
        lastTickRef.current = now;
        setElapsedMs((prev) => prev + delta);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      lastTickRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioPlaying, submitted]);

  const elapsedSeconds = elapsedMs / 1000;
  const potentialPoints = calculatePoints(elapsedSeconds, recording.difficulty);

  const isCorrect =
    submitted &&
    guess.trim().toLowerCase() === recording.commonName.toLowerCase();
  const earnedPoints = submitted && isCorrect ? potentialPoints : 0;

  const handleNext = useCallback(() => {
    if (advanceTimerRef.current) {
      clearInterval(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    onAnswer(guess, isCorrect, elapsedSeconds);
  }, [guess, isCorrect, elapsedSeconds, onAnswer]);

  const handleSubmit = useCallback(() => {
    if (!guess.trim() || submitted) return;
    setSubmitted(true);
  }, [guess, submitted]);

  // Auto-advance countdown after submission
  useEffect(() => {
    if (!submitted) return;

    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / AUTO_ADVANCE_MS) * 100, 100);
      setAutoAdvanceProgress(progress);
    };

    advanceTimerRef.current = setInterval(tick, 30);

    const timeout = setTimeout(() => {
      if (advanceTimerRef.current) clearInterval(advanceTimerRef.current);
      onAnswer(guess, isCorrect, elapsedSeconds);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (advanceTimerRef.current) clearInterval(advanceTimerRef.current);
      clearTimeout(timeout);
    };
  }, [submitted, guess, isCorrect, elapsedSeconds, onAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!submitted) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    },
    [submitted, handleSubmit, handleNext],
  );

  const xcUrl = `https://xeno-canto.org/${recording.xenoCantoId}`;
  const multiplier = DIFFICULTY_MULTIPLIER[recording.difficulty];

  return (
    <Card sx={{ maxWidth: 600, mx: "auto" }} onKeyDown={handleKeyDown}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Question {questionNumber} of {totalQuestions}
            </Typography>
            <Chip
              label={`${recording.difficulty}${multiplier > 1 ? ` ${multiplier}x` : ""}`}
              size="small"
              color={DIFFICULTY_COLOR[recording.difficulty]}
              variant="outlined"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              component="a"
              href={xcUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: "none", color: "text.secondary" }}
            >
              {recording.recordist}
            </Typography>
            <OpenInNewIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(questionNumber / totalQuestions) * 100}
          sx={{ mb: 2 }}
        />

        <Box
          component="img"
          src={recording.spectrogramFile}
          alt="Spectrogram"
          sx={{
            width: "100%",
            borderRadius: 1,
            mb: 2,
            backgroundColor: "grey.900",
          }}
        />

        <AudioPlayer
          src={recording.audioUrl}
          autoPlay={autoPlay}
          onPlayingChange={setAudioPlaying}
        />

        {/* Points indicator */}
        {!submitted && (
          <Box sx={{ mt: 1, textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                color:
                  elapsedSeconds < 3
                    ? "success.main"
                    : elapsedSeconds < 6
                      ? "warning.main"
                      : "text.secondary",
                fontWeight: elapsedSeconds < 6 ? "bold" : "normal",
              }}
            >
              {potentialPoints} pts
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 1 }}>
          <SpeciesAutocomplete
            value={guess}
            onChange={setGuess}
            disabled={submitted}
          />
        </Box>

        {!submitted ? (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 2,
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={!guess.trim()}
            >
              Submit
            </Button>
            {onSkip && (
              <Button
                variant="outlined"
                onClick={onSkip}
                sx={{ whiteSpace: "nowrap" }}
              >
                IDK
              </Button>
            )}
            {isDev && onReject && (
              <Tooltip title="Reject this recording (dev only)">
                <IconButton
                  color="warning"
                  onClick={() => onReject(recording.xenoCantoId)}
                >
                  <ThumbDownIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: isCorrect ? "success.dark" : "error.dark",
              }}
            >
              {isCorrect ? (
                <CheckCircleIcon color="success" />
              ) : (
                <CancelIcon color="error" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography>
                  {isCorrect
                    ? "Correct!"
                    : `Incorrect — it was ${recording.commonName}`}
                </Typography>
              </Box>
              {isCorrect && (
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  +{earnedPoints}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleNext}
                sx={{ position: "relative", overflow: "hidden" }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${autoAdvanceProgress}%`,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    transition: "width 30ms linear",
                  }}
                />
                Next
              </Button>
              {isDev && onReject && (
                <Tooltip title="Reject this recording (dev only)">
                  <IconButton
                    color="warning"
                    onClick={() => onReject(recording.xenoCantoId)}
                  >
                    <ThumbDownIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
