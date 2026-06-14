import { createContext, useContext } from "react";
import { CloudApi } from "./useCloudSync";

export const CloudContext = createContext<CloudApi | null>(null);

export function useCloud(): CloudApi {
  const ctx = useContext(CloudContext);
  if (!ctx) {
    return {
      authStatus: "out",
      email: null,
      syncStatus: "idle",
      error: null,
      signUp: async () => false,
      signIn: async () => false,
      signOut: async () => {},
      syncNow: async () => {},
    };
  }
  return ctx;
}
