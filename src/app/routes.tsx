import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AttemptReviewPage } from "@/pages/AttemptReviewPage";
import { GoalsPage } from "@/pages/GoalsPage";
import { HomePage } from "@/pages/HomePage";
import { QuizPage } from "@/pages/QuizPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/goals", element: <GoalsPage /> },
      { path: "/goals/:goalId/attempts/:attemptId", element: <AttemptReviewPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
  { path: "/quiz/:quizId", element: <QuizPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
