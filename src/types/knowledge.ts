export type LinkedQuizQuestion = { quizId: string; questionId: string };

export type KnowledgeItemMeta = {
  id: string;
  title: string;
  tags: string[];
  linkedQuizQuestions: LinkedQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeItem = KnowledgeItemMeta & {
  fileName: string;
  content: string;
};

export type InvalidKnowledgeReport = {
  fileName: string;
  issues: string[];
};

export type KnowledgeLinkWarning = {
  quizId: string;
  questionId: string;
  reason: "unknown_quiz" | "unknown_question";
};
