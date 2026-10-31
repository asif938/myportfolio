/** First focusable element on the page: lets keyboard users jump past the navigation. */
export default function SkipLink({ target = "main-content" }: { target?: string }) {
  return (
    <a
      id="skip-link"
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-brand-gradient-deep focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
