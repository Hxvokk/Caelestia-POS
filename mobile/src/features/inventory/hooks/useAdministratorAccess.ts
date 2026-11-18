import { useEffect, useState } from "react";
import { getCurrentUser } from "../../../shared/api/accountApi";
import type { CurrentUser } from "../../../shared/api/types";
import { useSessionStore } from "../../auth/store/sessionStore";

export function useAdministratorAccess() {
  const currentUser = useSessionStore((state) => state.currentUser);
  const setCurrentUser = useSessionStore((state) => state.setCurrentUser);
  const [isChecking, setIsChecking] = useState(!currentUser);

  useEffect(() => {
    let active = true;
    if (currentUser) {
      return () => {
        active = false;
      };
    }

    void getCurrentUser()
      .then((user: CurrentUser) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setIsChecking(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser, setCurrentUser]);

  return {
    isChecking,
    isAdministrator: currentUser?.role === "administrador",
  };
}
