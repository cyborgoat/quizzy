import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route, type QuizSearch } from "@/routes/quiz_.$quizId";
import { ErrorState } from "@/components/quiz/ErrorState";
import { ExitQuizDialog } from "@/components/quiz/ExitQuizDialog";
import { QuestionContent } from "@/components/quiz/QuestionContent";
import { QuizActionBar } from "@/components/quiz/QuizActionBar";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuizQuestionSidebar } from "@/components/quiz/QuizQuestionSidebar";
import { QuizStartScreen } from "@/components/quiz/QuizStartScreen";
import { ResultSummary } from "@/components/quiz/ResultSummary";
import { ReviewSummary } from "@/components/quiz/ReviewSummary";
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
import { cn } from "@/lib/utils";
import type { QuizSessionConfig } from "@/types/quizSession";
import type { Quiz } from "@/types/quiz";

function resolveSessionConfig(
  quiz: Quiz,
  search: QuizSearch,
): QuizSessionConfig | null {
  if (search.mode === "scored") {
    return { mode: "scored" };
  }
  if (search.mode === "practice") {
    const count = search.count;
    if (
      count == null ||
      count < 1 ||
      count > quiz.questions.length ||
      !Number.isInteger(count)
    ) {
      return null;
    }
    return { mode: "practice", questionCount: count };
  }
  return null;
}

function sessionModeLabel(config: QuizSessionConfig, totalQuestions: number) {
  if (config.mode === "scored") return "Scored attempt";
  return `Practice · ${totalQuestions} question${totalQuestions !== 1 ? "s" : ""}`;
}

function QuizSessionPage({
  quiz,
  config,
}: {
  quiz: Quiz;
  config: QuizSessionConfig;
}) {
  const navigate = useNavigate();
  const session = useQuizSession(quiz, config);
  const { recordAttempt, goals } = useGoals();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const recordedRef = useRef(false);

  const matchingGoal = useMemo(
    () => goals.find((goal) => goal.quizId === quiz.id),
    [goals, quiz.id],
  );

  useEffect(() => {
    if (session.isComplete && config.mode === "scored" && !recordedRef.current) {
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
      });
    } else if (!session.isComplete) {
      recordedRef.current = false;
    }
    // Record once when the session completes; avoid re-firing on unrelated session updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional completion gate
  }, [session.isComplete, config.mode]);

  if (session.isComplete) {
    const unansweredCount = session.answers.filter((answer) => !answer.answer).length;
    return (
      <PageShell width="quiz">
        <ResultSummary
          quiz={quiz}
          score={session.score}
          total={session.totalQuestions}
          modeLabel={sessionModeLabel(config, session.totalQuestions)}
          unansweredCount={unansweredCount}
          goal={
            matchingGoal
              ? {
                  id: matchingGoal.id,
                  achieved:
                    matchingGoal.targetScore === undefined ||
                    Math.round((session.score / session.totalQuestions) * 100) >=
                      matchingGoal.targetScore,
                }
              : undefined
          }
          onRestart={session.restart}
        />
        <ReviewSummary questions={session.questions} answers={session.answers} />
      </PageShell>
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
          modeLabel={sessionModeLabel(config, session.totalQuestions)}
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
  const search = Route.useSearch();
  const navigate = useNavigate();
  const library = useQuizLibrary();
  const quiz = useMemo(
    () => library.quizzes.find((source) => source.quiz.id === quizId)?.quiz,
    [library.quizzes, quizId],
  );

  if (library.isLoading && !quiz) {
    return <p className="py-20 text-center text-sm text-zinc-500">Loading quiz…</p>;
  }
  if (!quiz) {
    return (
      <PageShell width="quiz">
        <ErrorState
          title="Quiz not found"
          description="This quiz is unavailable or its file is no longer valid."
          actionLabel="Return home"
          onAction={() => navigate({ to: "/" })}
        />
      </PageShell>
    );
  }

  const sessionConfig = resolveSessionConfig(quiz, search);
  if (!sessionConfig) {
    const defaultMode = search.from === "goals" ? "scored" : "practice";
    return <QuizStartScreen quiz={quiz} defaultMode={defaultMode} />;
  }

  const sessionKey =
    sessionConfig.mode === "practice"
      ? `${quiz.id}-practice-${sessionConfig.questionCount}`
      : `${quiz.id}-scored`;

  return (
    <QuizSessionPage key={sessionKey} quiz={quiz} config={sessionConfig} />
  );
}
