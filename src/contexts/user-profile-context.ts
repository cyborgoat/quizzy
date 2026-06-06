import { createContext } from "react";

export type UserProfileContextValue = {
  userName: string;
  setUserName: (name: string) => void;
};

export const UserProfileContext = createContext<UserProfileContextValue | null>(null);
