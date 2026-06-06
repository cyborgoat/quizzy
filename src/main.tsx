import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/routes";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { QuizLibraryProvider } from "@/contexts/QuizLibraryContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProfileProvider>
      <QuizLibraryProvider>
        <GoalsProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </GoalsProvider>
      </QuizLibraryProvider>
    </UserProfileProvider>
  </StrictMode>,
);
