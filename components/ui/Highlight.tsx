/** Palette-driven highlight (marker or gradient pill). Use on ONE key word per heading. */
export default function Highlight({ children }: { children: React.ReactNode }) {
  return <mark className="hl">{children}</mark>;
}
