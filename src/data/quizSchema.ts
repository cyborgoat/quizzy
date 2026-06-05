import { z } from "zod";

const requiredString = z.string().trim().min(1);
const explanation = z.string().trim().min(1).optional();

const singleChoiceSchema = z
  .object({
    id: requiredString,
    type: z.literal("single_choice"),
    prompt: requiredString,
    options: z.array(requiredString).min(2),
    answerIndex: z.number().int().nonnegative(),
    explanation,
  })
  .superRefine((question, context) => {
    if (question.answerIndex >= question.options.length) {
      context.addIssue({
        code: "custom",
        path: ["answerIndex"],
        message: "Answer index must reference an available option.",
      });
    }
  });

const multipleChoiceSchema = z
  .object({
    id: requiredString,
    type: z.literal("multiple_choice"),
    prompt: requiredString,
    options: z.array(requiredString).min(2),
    answerIndices: z.array(z.number().int().nonnegative()).min(1),
    explanation,
  })
  .superRefine((question, context) => {
    if (new Set(question.answerIndices).size !== question.answerIndices.length) {
      context.addIssue({
        code: "custom",
        path: ["answerIndices"],
        message: "Answer indices must be unique.",
      });
    }

    if (question.answerIndices.some((index) => index >= question.options.length)) {
      context.addIssue({
        code: "custom",
        path: ["answerIndices"],
        message: "Every answer index must reference an available option.",
      });
    }
  });

const trueFalseSchema = z.object({
  id: requiredString,
  type: z.literal("true_false"),
  prompt: requiredString,
  answer: z.boolean(),
  explanation,
});

export const quizQuestionSchema = z.union([
  singleChoiceSchema,
  multipleChoiceSchema,
  trueFalseSchema,
]);

export const quizSchema = z
  .object({
    id: requiredString,
    title: requiredString,
    description: z.string().trim().min(1).optional(),
    tags: z.array(requiredString).default([]),
    questions: z.array(quizQuestionSchema).min(1),
  })
  .superRefine((quiz, context) => {
    const ids = new Set<string>();
    quiz.questions.forEach((question, index) => {
      if (ids.has(question.id)) {
        context.addIssue({
          code: "custom",
          path: ["questions", index, "id"],
          message: "Question IDs must be unique within a quiz.",
        });
      }
      ids.add(question.id);
    });
  });
