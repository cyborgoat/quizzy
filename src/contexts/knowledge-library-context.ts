import { createContext } from "react";
import type { InvalidKnowledgeReport, KnowledgeItem } from "@/types/knowledge";

export type KnowledgeLibraryRefreshOptions = {
  background?: boolean;
};

export type CreateKnowledgeDraft = {
  title: string;
  tags?: string[];
  content?: string;
  linkedQuizQuestions?: KnowledgeItem["linkedQuizQuestions"];
};

export const KNOWLEDGE_BASE_FOLDER = "knowledge-base";

export type KnowledgeLibraryContextValue = {
  directoryPath: string | null;
  knowledgeDirectoryPath: string | null;
  directoryAvailable: boolean;
  items: KnowledgeItem[];
  invalidReports: InvalidKnowledgeReport[];
  isLoading: boolean;
  refresh: (options?: KnowledgeLibraryRefreshOptions) => Promise<void>;
  createItem: (draft: CreateKnowledgeDraft) => Promise<KnowledgeItem>;
  saveItem: (item: KnowledgeItem) => Promise<void>;
  deleteItem: (fileName: string) => Promise<void>;
  openKnowledgeFolder: () => Promise<void>;
  getNotesForQuestion: (quizId: string, questionId: string) => KnowledgeItem[];
};

export const KnowledgeLibraryContext = createContext<KnowledgeLibraryContextValue | null>(null);
