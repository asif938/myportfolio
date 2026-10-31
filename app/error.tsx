"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Button from "@/components/ui/Button";

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-center text-fg">
      <Atmosphere variant="soft" side="left" />
      <div className="relative flex flex-col items-center">
        <p className="cursor mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Error</p>
        <h1 className="text-hero font-bold">
          Something went <span className="hl">wrong</span>
        </h1>
        <p className="mt-5 max-w-md text-muted">An unexpected error occurred. Please try again.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button onClick={reset} chipIcon={RotateCcw}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
