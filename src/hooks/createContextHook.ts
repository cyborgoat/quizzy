import { useContext, type Context } from "react";

export function createContextHook<T>(context: Context<T | null>, providerName: string) {
  return function useContextValue(): T {
    const value = useContext(context);
    if (!value) {
      throw new Error(`${providerName} must be used within ${providerName}.`);
    }
    return value;
  };
}
