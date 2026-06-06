import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/HomePage";
import { QuizPage } from "@/pages/QuizPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
  { path: "/quiz/:quizId", element: <QuizPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
