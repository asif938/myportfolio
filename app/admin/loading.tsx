export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 rounded bg-gray-100 dark:bg-gray-700/60" />
        <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 rounded bg-gray-100 dark:bg-gray-700/60" />
        <div className="h-24 rounded bg-gray-100 dark:bg-gray-700/60" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
