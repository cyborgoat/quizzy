import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/quiz/ErrorState";
import { QuestionContent } from "@/components/quiz/QuestionContent";
import { QuizActionBar } from "@/components/quiz/QuizActionBar";
import { QuizFeedback } from "@/components/quiz/QuizFeedback";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { ResultSummary } from "@/components/quiz/ResultSummary";
import { ReviewSummary } from "@/components/quiz/ReviewSummary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizSession } from "@/hooks/useQuizSession";
import type { Quiz } from "@/types/quiz";

function QuizSessionPage({ quiz }: { quiz: Quiz }) {
  const session = useQuizSession(quiz);

  if (session.isComplete) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ResultSummary quiz={quiz} score={session.score} onRestart={session.restart} />
        <ReviewSummary quiz={quiz} answers={session.answers} />
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <QuizHeader
        title={quiz.title}
        current={session.currentQuestionIndex + 1}
        total={session.totalQuestions}
      />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 sm:px-6 lg:px-8">
        <QuestionContent
          question={session.currentQuestion}
          selectedSingle={session.selectedSingleChoiceIndex}
          selectedMultiple={session.selectedMultipleChoiceIndices}
          selectedTrueFalse={session.selectedTrueFalseAnswer}
          locked={session.hasSubmittedAnswer}
          onSingle={session.selectSingleChoiceAnswer}
          onMultiple={session.toggleMultipleChoiceAnswer}
          onTrueFalse={session.selectTrueFalseAnswer}
        />
        {session.hasSubmittedAnswer && session.currentAnswerIsCorrect !== null && (
          <QuizFeedback
            isCorrect={session.currentAnswerIsCorrect}
            explanation={session.currentQuestion.explanation}
          />
        )}
      </main>
      <QuizActionBar
        submitted={session.hasSubmittedAnswer}
        isLast={session.currentQuestionIndex === session.totalQuestions - 1}
        error={session.submissionError}
        onSubmit={session.submitAnswer}
        onNext={session.goToNextQuestion}
      />
    </div>
  );
}

export function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const quiz = useMemo(
    () => library.quizzes.find((source) => source.quiz.id === quizId)?.quiz,
    [library.quizzes, quizId],
  );

  if (library.isLoading) {
    return <p className="py-20 text-center text-sm text-zinc-500">Loading quiz…</p>;
  }
  if (!quiz) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <ErrorState
          title="Quiz not found"
          description="This quiz is unavailable or its file is no longer valid."
          actionLabel="Return home"
          onAction={() => navigate("/")}
        />
      </main>
    );
  }

  return <QuizSessionPage key={quiz.id} quiz={quiz} />;
}
