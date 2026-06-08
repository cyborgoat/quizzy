import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/app/router";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { UiPreferencesProvider } from "@/contexts/UiPreferencesContext";
import { MistakeLogSettingsProvider } from "@/contexts/MistakeLogSettingsContext";
import { QuizLibraryProvider } from "@/contexts/QuizLibraryContext";
import { QuizPreferencesProvider } from "@/contexts/QuizPreferencesContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { Toaster } from "@/components/ui/sonner";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProfileProvider>
      <UiPreferencesProvider>
        <QuizPreferencesProvider>
          <MistakeLogSettingsProvider>
            <QuizLibraryProvider>
              <GoalsProvider>
                <RouterProvider router={router} />
                <Toaster position="bottom-right" />
              </GoalsProvider>
            </QuizLibraryProvider>
          </MistakeLogSettingsProvider>
        </QuizPreferencesProvider>
      </UiPreferencesProvider>
    </UserProfileProvider>
  </StrictMode>,
);
