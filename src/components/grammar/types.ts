export type GrammarItem = {
  id: string;
  title: string;
  slug: string;
  grammarType?: string | null;
  level?: string | null;
  explanation: string;
  usageGuide?: string | null;
  structurePattern?: string | null;
  exampleSentence?: string | null;
  storyExample?: string | null;
  practiceHint?: string | null;
  tags: string[];
  isSeed?: boolean;
  createdAt?: string;
};

export type GrammarExercise = {
  id: string;
  prompt: string;
  focus: string;
  sampleAnswer: string;
  tips: string;
};

export type GrammarTrainingDrill = {
  summary: string;
  contextScenario: string;
  exercises: GrammarExercise[];
};

export type TrainingEvaluationResult = {
  score: number;
  maxScore: number;
  feedback: string;
  improvedAnswer: string;
  mistakes: string[];
  nextStep: string;
};

export type MCQOption = {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
};

export type GrammarMCQQuestion = {
  id: string;
  grammarTitle: string;
  context: string;
  question: string;
  options: MCQOption[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

export type GrammarEssayQuestion = {
  id: string;
  grammarTitle: string;
  context: string;
  prompt: string;
  sampleAnswer: string;
  scoringGuide: string;
};

export type EssayQuizEvaluationItem = {
  id: string;
  score: number;
  maxScore: number;
  feedback: string;
  modelSuggestion: string;
};

export type EssayQuizEvaluationResult = {
  totalScore: number;
  maxScore: number;
  overallFeedback: string;
  items: EssayQuizEvaluationItem[];
};
