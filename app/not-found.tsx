import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        404
      </p>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
      >
        <ArrowLeft size={18} /> Back to home
      </Link>
    </main>
  );
}
