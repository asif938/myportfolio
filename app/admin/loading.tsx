export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded bg-surface-2" />
      <div className="space-y-4 rounded-lg bg-surface p-6 shadow-sm">
        <div className="h-4 w-1/3 rounded bg-surface-2" />
        <div className="h-10 rounded bg-bg-2" />
        <div className="h-4 w-1/4 rounded bg-surface-2" />
        <div className="h-10 rounded bg-bg-2" />
        <div className="h-24 rounded bg-bg-2" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
