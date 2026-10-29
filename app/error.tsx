"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        Error
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          <RotateCcw size={18} /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
