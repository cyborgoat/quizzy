import { createBrowserRouter, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { QuizPage } from "@/pages/QuizPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/quiz/:quizId", element: <QuizPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
