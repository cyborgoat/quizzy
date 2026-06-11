import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/app/router";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { KnowledgeLibraryProvider } from "@/contexts/KnowledgeLibraryContext";
import { QuizLibraryProvider } from "@/contexts/QuizLibraryContext";
import { WorkingDirectoryProvider } from "@/contexts/WorkingDirectoryContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/index.css";
import "@mdxeditor/editor/style.css";
import "katex/dist/katex.min.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppSettingsProvider>
      <WorkingDirectoryProvider>
        <QuizLibraryProvider>
          <KnowledgeLibraryProvider>
            <GoalsProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
                <Toaster position="bottom-right" />
              </TooltipProvider>
            </GoalsProvider>
          </KnowledgeLibraryProvider>
        </QuizLibraryProvider>
      </WorkingDirectoryProvider>
    </AppSettingsProvider>
  </StrictMode>,
);
