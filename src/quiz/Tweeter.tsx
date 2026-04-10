import { useState } from 'react';
import { Quiz } from './Quiz';
import { QuizSelect } from './QuizSelect';
import { QUIZZES } from './quizzes';
import type { QuizConfig } from './types';

export function Tweeter() {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizConfig | null>(null);

  if (selectedQuiz) {
    return <Quiz config={selectedQuiz} onBack={() => setSelectedQuiz(null)} />;
  }

  return <QuizSelect quizzes={QUIZZES} onSelect={setSelectedQuiz} />;
}
