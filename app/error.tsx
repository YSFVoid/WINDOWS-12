"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorBoundary({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("PurpleOS crashed:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090414] text-violet-50">
      <div className="glass-panel w-[min(92vw,480px)] rounded-[22px] border border-white/15 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300/70">
          PurpleOS Recovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-violet-100/80">
          The session hit an unexpected error. You can safely retry.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl border border-violet-200/35 bg-violet-500/25 px-4 py-2 text-sm font-semibold text-violet-50 transition hover:bg-violet-500/35"
        >
          Retry session
        </button>
      </div>
    </div>
  );
}
