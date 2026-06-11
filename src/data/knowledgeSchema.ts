import { z } from "zod";
import { normalizeTags } from "@/lib/knowledgeDraft";

const linkedQuizQuestionSchema = z.object({
  quizId: z.string().min(1, "quizId is required."),
  questionId: z.string().min(1, "questionId is required."),
});

export const knowledgeMetaSchema = z.object({
  id: z.string().min(1, "id is required."),
  title: z.string().trim().min(1, "title is required."),
  tags: z.array(z.string()).default([]).transform(normalizeTags),
  linkedQuizQuestions: z.array(linkedQuizQuestionSchema).default([]),
  createdAt: z.string().min(1, "createdAt is required."),
  updatedAt: z.string().min(1, "updatedAt is required."),
});

export type KnowledgeMetaInput = z.input<typeof knowledgeMetaSchema>;
export type KnowledgeMetaOutput = z.output<typeof knowledgeMetaSchema>;
