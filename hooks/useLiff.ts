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

declare global {
  interface Window {
    liff: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: () => void;
      getProfile: () => Promise<{ userId: string; displayName: string }>;
      getAccessToken: () => string | null;
    };
  }
}

function loadLiffSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.liff) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("LIFF SDK読み込み失敗"));
    document.head.appendChild(script);
  });
}

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

    loadLiffSdk()
      .then(() => window.liff.init({ liffId }))
      .then(async () => {
        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        const profile = await window.liff.getProfile();
        setState({
          isReady: true,
          isLoggedIn: true,
          userId: profile.userId,
          displayName: profile.displayName,
          error: null,
          accessToken: window.liff.getAccessToken(),
        });
      })
      .catch((err: unknown) => {
        const errObj = err as Record<string, unknown>;
        setState((prev) => ({
          ...prev,
          error: `LIFF初期化エラー: ${errObj.code || ""} ${errObj.message || String(err)}`,
        }));
      });
  }, []);

  return state;
}
