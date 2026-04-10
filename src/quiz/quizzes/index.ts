import type { QuizConfig } from '../types';
import mcgolrickRecordings from './mcgolrick-april/recordings.json';
import nycWarblersRecordings from './nyc-spring-warblers/recordings.json';
import type { RecordingManifest } from '../types';

export const QUIZZES: QuizConfig[] = [
  {
    id: 'mcgolrick-april',
    title: 'McGolrick Park — April',
    subtitle: 'Brooklyn, NY',
    description:
      'The top 50 birds at McGolrick Park in April. All species — how many can you get?',
    recordings: mcgolrickRecordings as RecordingManifest[],
  },
  {
    id: 'nyc-spring-warblers',
    title: 'NYC Spring Warblers',
    subtitle: 'April – June',
    description:
      'Every warbler passing through the five boroughs in spring. A true test of your warbler skills.',
    recordings: nycWarblersRecordings as RecordingManifest[],
  },
];

export function getQuiz(id: string): QuizConfig | undefined {
  return QUIZZES.find((q) => q.id === id);
}
