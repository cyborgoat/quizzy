export type SingleChoiceQuestion = {
  id: string;
  type: "single_choice";
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "multiple_choice";
  prompt: string;
  options: string[];
  answerIndices: number[];
  explanation?: string;
};

export type TrueFalseQuestion = {
  id: string;
  type: "true_false";
  prompt: string;
  answer: boolean;
  explanation?: string;
};

export type QuizQuestion =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion;

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  questions: QuizQuestion[];
};

export type QuizSource = {
  fileName: string;
  quiz: Quiz;
};

export type InvalidQuizReport = {
  fileName: string;
  issues: string[];
};

export type SingleChoiceAnswer = {
  type: "single_choice";
  selectedIndex: number;
};

export type MultipleChoiceAnswer = {
  type: "multiple_choice";
  selectedIndices: number[];
};

export type TrueFalseAnswer = {
  type: "true_false";
  selectedAnswer: boolean;
};

export type SubmittedAnswer =
  | SingleChoiceAnswer
  | MultipleChoiceAnswer
  | TrueFalseAnswer;

export type AnswerRecord = {
  questionId: string;
  answer: SubmittedAnswer;
  isCorrect: boolean;
};
