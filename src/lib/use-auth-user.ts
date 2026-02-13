"use client";

import { useEffect, useState } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";

import { authFetch } from "@/lib/auth-fetch";
import { firebaseAuth } from "@/lib/firebase-client";

type UseAuthUserOptions = {
  syncOnSignIn?: boolean;
};

let latestSyncedUid: string | null = null;

export function useAuthUser(options?: UseAuthUserOptions) {
  const syncOnSignIn = options?.syncOnSignIn ?? false;
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      if (cancelled) return;
      setUser(nextUser);

      if (syncOnSignIn && nextUser && latestSyncedUid !== nextUser.uid) {
        latestSyncedUid = nextUser.uid;
        await authFetch("/api/auth/sync", { method: "POST" }).catch(() => null);
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [syncOnSignIn]);

  return { user, loading };
}
