import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState } from "@/components/quiz/ErrorState";
import { ExitQuizDialog } from "@/components/quiz/ExitQuizDialog";
import { QuestionContent } from "@/components/quiz/QuestionContent";
import { QuizActionBar } from "@/components/quiz/QuizActionBar";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuizQuestionSidebar } from "@/components/quiz/QuizQuestionSidebar";
import { ResultSummary } from "@/components/quiz/ResultSummary";
import { ReviewSummary } from "@/components/quiz/ReviewSummary";
import { SubmitQuizDialog } from "@/components/quiz/SubmitQuizDialog";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizSession } from "@/hooks/useQuizSession";
import type { Quiz } from "@/types/quiz";

function QuizSessionPage({ quiz }: { quiz: Quiz }) {
  const navigate = useNavigate();
  const session = useQuizSession(quiz);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

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
          currentIndex={session.currentQuestionIndex}
          onPrevious={session.goToPreviousQuestion}
          onNext={session.goToNextQuestion}
        />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-10 sm:px-6 lg:px-8">
          <QuestionContent
            question={session.currentQuestion}
            answer={session.currentAnswer}
            flagged={session.currentQuestionIsFlagged}
            onToggleFlag={session.toggleCurrentQuestionFlag}
            onSingle={session.selectSingleChoiceAnswer}
            onMultiple={session.toggleMultipleChoiceAnswer}
            onTrueFalse={session.selectTrueFalseAnswer}
          />
        </main>
        <QuizActionBar
          onSubmitQuiz={() => setSubmitDialogOpen(true)}
          onExitQuiz={() => setExitDialogOpen(true)}
        />
        <ExitQuizDialog
          open={exitDialogOpen}
          answeredCount={session.answeredCount}
          totalQuestions={session.totalQuestions}
          onCancel={() => setExitDialogOpen(false)}
          onConfirm={() => {
            setExitDialogOpen(false);
            navigate("/");
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
