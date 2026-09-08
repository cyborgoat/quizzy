import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/quiz_.$quizId";
import { ErrorState } from "@/components/quiz/ErrorState";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { LoadingState } from "@/components/quiz/LoadingState";
import { ExitQuizDialog } from "@/components/quiz/ExitQuizDialog";
import { QuestionContent } from "@/components/quiz/QuestionContent";
import { QuizActionBar } from "@/components/quiz/QuizActionBar";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuizQuestionSidebar } from "@/components/quiz/QuizQuestionSidebar";
import { SubmitQuizDialog } from "@/components/quiz/SubmitQuizDialog";
import { PageShell } from "@/components/layout/PageShell";
import { quizChromeInnerClass } from "@/components/layout/pageShellClasses";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizSession } from "@/hooks/useQuizSession";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types/quiz";

function ScoredAttemptRedirect({
  quiz,
  session,
  recordAttempt,
}: {
  quiz: Quiz;
  session: ReturnType<typeof useQuizSession>;
  recordAttempt: ReturnType<typeof useGoals>["recordAttempt"];
}) {
  const navigate = useNavigate();
  const recordedRef = useRef(false);
  const [missingGoal, setMissingGoal] = useState(false);

  useEffect(() => {
    if (!session.isComplete || recordedRef.current) return;
    recordedRef.current = true;

    void recordAttempt(quiz.id, {
      score: session.score,
      total: session.totalQuestions,
      questionResults: session.questions.map((q, i) => ({
        questionId: q.id,
        prompt: q.prompt,
        correct: session.answers[i]?.isCorrect ?? false,
        answer: session.answers[i]?.answer,
        options:
          q.type === "single_choice" || q.type === "multiple_choice"
            ? q.options
            : undefined,
        flagged: session.answers[i]?.flagged ?? false,
      })),
    }).then((recorded) => {
      if (recorded) {
        navigate({
          to: "/quizzes/$quizId/attempts/$attemptId",
          params: {
            quizId: quiz.id,
            attemptId: recorded.attemptId,
          },
          replace: true,
        });
        return;
      }
      setMissingGoal(true);
    });
  }, [quiz.id, session.isComplete, session.score, session.totalQuestions, session.questions, session.answers, recordAttempt, navigate]);

  if (missingGoal) {
    return (
      <PageShell width="quiz">
        <ErrorState
          title="No goal for this quiz"
          description="Scored attempts are saved to a goal. Create a goal for this quiz to review your attempt."
          actionLabel="Home"
          onAction={() => navigate({ to: "/" })}
        />
      </PageShell>
    );
  }

  return (
    <PageShell width="quiz">
      <InlineEmptyMessage>Saving attempt and opening review…</InlineEmptyMessage>
    </PageShell>
  );
}

function QuizSessionPage({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate();
  const session = useQuizSession(quiz);
  const { recordAttempt } = useGoals();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const disablePrevious = session.currentQuestionIndex === 0;
  const disableNext =
    session.currentQuestionIndex === session.totalQuestions - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      if (submitDialogOpen || exitDialogOpen) return;
      if (isEditableKeyboardTarget(event.target)) return;
      if (session.totalQuestions === 0) return;

      event.preventDefault();

      if (event.key === "ArrowUp" && !disablePrevious) {
        session.goToPreviousQuestion();
      }
      if (event.key === "ArrowDown" && !disableNext) {
        session.goToNextQuestion();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    submitDialogOpen,
    exitDialogOpen,
    disablePrevious,
    disableNext,
    session.totalQuestions,
    session.goToPreviousQuestion,
    session.goToNextQuestion,
  ]);

  if (session.isComplete) {
    return (
      <ScoredAttemptRedirect
        quiz={quiz}
        session={session}
        recordAttempt={recordAttempt}
      />
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
        <main className={cn(quizChromeInnerClass, "flex-1 py-5")}>
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
              disabled={disablePrevious}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={session.goToNextQuestion}
              disabled={disableNext}
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
            navigate({ to: "/", search: {} });
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
  const source = useMemo(
    () => library.quizzes.find((item) => item.quiz.id === quizId),
    [library.quizzes, quizId],
  );
  const quiz = source?.quiz;

  if (library.isLoading && !quiz) {
    return <LoadingState message="Loading quiz…" />;
  }
  if (!quiz) {
    return (
      <PageShell width="quiz">
        <ErrorState
          title="Quiz not found"
          description="This quiz is unavailable or its file is no longer valid."
          actionLabel="Home"
          onAction={() => navigate({ to: "/" })}
        />
      </PageShell>
    );
  }

  if (source.archived) {
    return (
      <PageShell width="quiz">
        <ErrorState
          title="Quiz is archived"
          description="Restore this quiz from the Archived filter before starting it."
          actionLabel="Home"
          onAction={() => navigate({ to: "/" })}
        />
      </PageShell>
    );
  }

  return <QuizSessionPage key={quiz.id} quiz={quiz} />;
}
