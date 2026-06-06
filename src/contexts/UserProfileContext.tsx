import { useState, type ReactNode } from "react";
import { UserProfileContext } from "@/contexts/user-profile-context";

const NAME_KEY = "quizzy:profile:name";

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string>(
    () => localStorage.getItem(NAME_KEY) ?? "",
  );

  function setUserName(name: string) {
    localStorage.setItem(NAME_KEY, name);
    setUserNameState(name);
  }

  return (
    <UserProfileContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserProfileContext.Provider>
  );
}
