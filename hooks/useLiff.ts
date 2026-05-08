"use client";

import { useState, useEffect } from "react";
import liff from "@line/liff";

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
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2010011578-6QjjLlVT";
    if (!liffId) {
      setState((prev) => ({ ...prev, error: "LIFF IDが設定されていません" }));
      return;
    }

    liff
      .init({ liffId })
      .then(async () => {
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
      .catch((err: Error) => {
        setState((prev) => ({
          ...prev,
          error: `LIFF初期化エラー: ${err.message} (ID: ${liffId})`,
        }));
      });
  }, []);

  return state;
}
