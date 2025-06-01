export interface MathExpression {
  id: string;
  expression: string;
}

export interface MathOptionExpression extends MathExpression {
  optionIndex: number;
}

export interface MathStorage {
  [key: string]: {
    question: MathExpression[];
    options: MathOptionExpression[];
    explanation: MathExpression[];
  };
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Exercise {
  id: string;
  chapterId: string;
  themeId: string;
  subjectId: string;
  classId: string;
  countryId: string;
  schoolTypeId: string;
  title: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  questions: Question[];
  createdAt?: string;
  isCompleted?: boolean;
  score?: number;
}

export interface ExerciseGenerationPrompt {
  class: string;
  section?: string;
  subject: string;
  chapter: string;
  content: string;
}

export interface Exercices {
  id?: string;
  title: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  questions: Question[];
  metadata?: {
    subject?: string;
    class?: string;
    chapter?: string;
    content?: string;
  };
}