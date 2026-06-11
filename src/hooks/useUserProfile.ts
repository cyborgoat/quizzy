import { UserProfileContext } from "@/contexts/user-profile-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useUserProfile = createContextHook(UserProfileContext, "AppSettingsProvider");
