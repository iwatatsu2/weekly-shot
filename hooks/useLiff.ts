"use client";

import { useState, useEffect } from "react";

type LiffState = {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  displayName: string | null;
  error: string | null;
  accessToken: string | null;
};

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    userId: null,
    displayName: null,
    error: null,
    accessToken: null,
  });

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2010011578-db7AxPzc";

    import("@line/liff")
      .then((liffModule) => liffModule.default)
      .then(async (liff) => {
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setState({
          isReady: true,
          isLoggedIn: true,
          userId: profile.userId,
          displayName: profile.displayName,
          error: null,
          accessToken: liff.getAccessToken(),
        });
      })
      .catch((err: unknown) => {
        const errObj = err as Record<string, unknown>;
        const detail = JSON.stringify(
          { code: errObj.code, message: errObj.message, name: errObj.name },
          null,
          2
        );
        setState((prev) => ({
          ...prev,
          error: `LIFF初期化エラー: ${detail} (ID: ${liffId})`,
        }));
      });
  }, []);

  return state;
}
