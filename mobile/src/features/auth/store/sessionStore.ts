import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import type { CurrentUser } from "../../../shared/api/types";

type SessionState = {
  initialized: boolean;
  session: Session | null;
  currentUser: CurrentUser | null;
  setSession: (session: Session | null) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  initialized: false,
  session: null,
  currentUser: null,
  setSession: (session) => set({
    session,
    initialized: true,
    ...(!session && { currentUser: null }),
  }),
  setCurrentUser: (currentUser) => set({ currentUser }),
}));
