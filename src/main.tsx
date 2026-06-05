import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { QuizLibraryProvider } from "@/contexts/QuizLibraryContext";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QuizLibraryProvider>
      <RouterProvider router={router} />
    </QuizLibraryProvider>
  </StrictMode>,
);
