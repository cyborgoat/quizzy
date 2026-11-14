import { Outlet } from "@tanstack/react-router";
import { QuizStartDialogProvider } from "@/contexts/QuizStartDialogContext";

/** Shared by the app layout and the standalone quiz / result screen. */
export function RootLayout() {
  return (
    <QuizStartDialogProvider>
      <Outlet />
    </QuizStartDialogProvider>
  );
}
