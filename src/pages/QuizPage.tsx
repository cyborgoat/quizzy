import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/quiz_.$quizId";
import { ErrorState } from "@/components/quiz/ErrorState";
import { ExitQuizDialog } from "@/components/quiz/ExitQuizDialog";
import { QuestionContent } from "@/components/quiz/QuestionContent";
import { QuizActionBar } from "@/components/quiz/QuizActionBar";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuizQuestionSidebar } from "@/components/quiz/QuizQuestionSidebar";
import { ResultSummary } from "@/components/quiz/ResultSummary";
import { ReviewSummary } from "@/components/quiz/ReviewSummary";
import { SubmitQuizDialog } from "@/components/quiz/SubmitQuizDialog";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizSession } from "@/hooks/useQuizSession";
import type { Quiz } from "@/types/quiz";

function QuizSessionPage({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate();
  const session = useQuizSession(quiz);
  const { recordAttempt } = useGoals();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const recordedRef = useRef(false);

  useEffect(() => {
    if (session.isComplete && !recordedRef.current) {
      recordedRef.current = true;
      void recordAttempt(quiz.id, {
        score: session.score,
        total: session.totalQuestions,
        questionResults: session.questions.map((q, i) => ({
          questionId: q.id,
          prompt: q.prompt,
          correct: session.answers[i]?.isCorrect ?? false,
          answer: session.answers[i]?.answer,
          flagged: session.answers[i]?.flagged ?? false,
        })),
      });
    } else if (!session.isComplete) {
      recordedRef.current = false;
    }
    // Record once when the session completes; avoid re-firing on unrelated session updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional completion gate
  }, [session.isComplete]);

  if (session.isComplete) {
    const unansweredCount = session.answers.filter((answer) => !answer.answer).length;
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <ResultSummary
          quiz={quiz}
          score={session.score}
          unansweredCount={unansweredCount}
          onRestart={session.restart}
        />
        <ReviewSummary questions={session.questions} answers={session.answers} />
      </main>
    );
  }

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-mobile": "17rem",
        } as CSSProperties
      }
    >
      <QuizQuestionSidebar
        questions={session.questions}
        attempts={session.attempts}
        currentIndex={session.currentQuestionIndex}
        answeredCount={session.answeredCount}
        flaggedCount={session.flaggedCount}
        onSelectQuestion={session.goToQuestion}
      />
      <SidebarInset className="flex min-h-svh flex-col bg-transparent">
        <QuizHeader
          title={quiz.title}
          current={session.currentQuestionIndex + 1}
          total={session.totalQuestions}
          answered={session.answeredCount}
        />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <QuestionContent
            question={session.currentQuestion}
            answer={session.currentAnswer}
            flagged={session.currentQuestionIsFlagged}
            onToggleFlag={session.toggleCurrentQuestionFlag}
            onSingle={session.selectSingleChoiceAnswer}
            onMultiple={session.toggleMultipleChoiceAnswer}
            onTrueFalse={session.selectTrueFalseAnswer}
          />
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={session.goToPreviousQuestion}
              disabled={session.currentQuestionIndex === 0}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={session.goToNextQuestion}
              disabled={session.currentQuestionIndex === session.totalQuestions - 1}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </main>
        <QuizActionBar
          onExitQuiz={() => setExitDialogOpen(true)}
          onSubmitQuiz={() => setSubmitDialogOpen(true)}
        />
        <ExitQuizDialog
          open={exitDialogOpen}
          answeredCount={session.answeredCount}
          totalQuestions={session.totalQuestions}
          onCancel={() => setExitDialogOpen(false)}
          onConfirm={() => {
            setExitDialogOpen(false);
            navigate({ to: "/" });
          }}
        />
        <SubmitQuizDialog
          open={submitDialogOpen}
          answeredCount={session.answeredCount}
          unansweredCount={session.unansweredCount}
          flaggedCount={session.flaggedCount}
          onCancel={() => setSubmitDialogOpen(false)}
          onConfirm={() => {
            setSubmitDialogOpen(false);
            session.submitQuiz();
          }}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

export function QuizPage() {
  const { quizId } = Route.useParams();
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
          onAction={() => navigate({ to: "/" })}
        />
      </main>
    );
  }

  return <QuizSessionPage key={quiz.id} quiz={quiz} />;
}
