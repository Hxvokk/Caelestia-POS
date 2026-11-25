import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../../../shared/api/accountApi";
import { getApiErrorMessage } from "../../../shared/api/client";
import type { CurrentUser } from "../../../shared/api/types";
import { useSessionStore } from "../../auth/store/sessionStore";

export function useAdministratorAccess() {
  const currentUser = useSessionStore((state) => state.currentUser);
  const setCurrentUser = useSessionStore((state) => state.setCurrentUser);
  const [isChecking, setIsChecking] = useState(!currentUser);
  const [error, setError] = useState<string | null>(null);

  const saveCurrentUser = useCallback((user: CurrentUser) => {
    const role = user.role.trim().toLocaleLowerCase();
    if (role !== "administrador" && role !== "vendedor") {
      throw new Error("La cuenta tiene un rol no reconocido.");
    }
    setCurrentUser({ ...user, role });
  }, [setCurrentUser]);

  useEffect(() => {
    if (currentUser) return;

    let active = true;
    void getCurrentUser()
      .then((user) => {
        if (!active) return;
        setIsChecking(false);
        saveCurrentUser(user);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(getApiErrorMessage(loadError));
        setIsChecking(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser, saveCurrentUser]);

  const retry = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    try {
      saveCurrentUser(await getCurrentUser());
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsChecking(false);
    }
  }, [saveCurrentUser]);

  return {
    isChecking,
    error,
    retry,
    isAdministrator: currentUser?.role === "administrador",
  };
}
