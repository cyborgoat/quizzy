import { useEffect, useState, type ReactNode } from "react";
import { UserProfileContext } from "@/contexts/user-profile-context";
import { loadAppSettings } from "@/lib/appSettings";

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState("");

  useEffect(() => {
    void loadAppSettings().then((settings) => {
      setUserNameState(settings.profileName);
    });
  }, []);

  function setUserName(name: string) {
    setUserNameState(name);
  }

  return (
    <UserProfileContext.Provider value={{ userName, setUserName }}>
      {children}
    </UserProfileContext.Provider>
  );
}
