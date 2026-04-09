export type Difficulty = 'easy' | 'medium' | 'hard';

export interface RecordingManifest {
  commonName: string;
  scientificName: string;
  audioUrl: string;
  spectrogramFile: string;
  xenoCantoId: string;
  recordist: string;
  difficulty: Difficulty;
  country: string;
  location: string;
}

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

// Points: base 100 for correct, time bonus decays over 6 seconds
const BASE_POINTS = 100;
const FAST_THRESHOLD = 3; // seconds — full speed bonus
const MEDIUM_THRESHOLD = 6; // seconds — partial speed bonus
const MAX_SPEED_BONUS = 100;

export function calculatePoints(
  elapsedSeconds: number,
  difficulty: Difficulty
): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty];
  let speedBonus = 0;
  if (elapsedSeconds < FAST_THRESHOLD) {
    speedBonus = MAX_SPEED_BONUS;
  } else if (elapsedSeconds < MEDIUM_THRESHOLD) {
    const frac =
      1 -
      (elapsedSeconds - FAST_THRESHOLD) / (MEDIUM_THRESHOLD - FAST_THRESHOLD);
    speedBonus = Math.round(MAX_SPEED_BONUS * frac);
  }
  return Math.round((BASE_POINTS + speedBonus) * multiplier);
}

export interface QuizConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  recordings: RecordingManifest[];
  /** If set, quiz picks this many random questions. If unset, uses all recordings. */
  questionsPerRound?: number;
}

export interface QuizAnswer {
  correct: boolean;
  guessed: string;
  actual: string;
  skipped?: boolean;
  recording: RecordingManifest;
  points: number;
  elapsedSeconds: number;
}
