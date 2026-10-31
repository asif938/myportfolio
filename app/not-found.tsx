import { ArrowLeft } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-center text-fg">
      <Atmosphere variant="soft" side="right" />
      <div className="relative flex flex-col items-center">
        <p className="cursor mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">404</p>
        <h1 className="text-hero font-bold">
          Page <span className="hl">not found</span>
        </h1>
        <p className="mt-5 max-w-md text-muted">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Button href="/" chipIcon={ArrowLeft} className="mt-8">
          Back to home
        </Button>
      </div>
    </main>
  );
}
