import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Hind_Siliguri } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeColor from "@/components/ThemeColor";
import { getProfile, getSkills } from "@/lib/data";
import { SITE_URL, truncate } from "@/lib/site";
import "./palettes/prism.css";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});
// Bangla fallback so Bangla text never drops to a system font (only fetched when used).
const bangla = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-bangla",
  preload: false,
});

const FALLBACK_NAME = "Portfolio";

// The analytics scripts are served by Vercel; elsewhere they would only 404.
const isVercel = Boolean(process.env.VERCEL);

export async function generateMetadata(): Promise<Metadata> {
  const [profile, skills] = await Promise.all([getProfile(), getSkills()]);
  const name = profile?.name ?? FALLBACK_NAME;
  const designation = profile?.designation;
  const title = designation ? `${name} — ${designation}` : name;
  const description = truncate(
    profile?.tagline || profile?.aboutMe || `Personal portfolio and resume of ${name}.`,
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    authors: [{ name, url: SITE_URL }],
    creator: name,
    keywords: [
      name,
      ...(designation ? [designation] : []),
      "portfolio",
      "resume",
      ...skills.slice(0, 15).map((s) => s.name),
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: name,
      title,
      description,
      url: "/",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080616" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html
      lang="en"
      data-palette="prism"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${bangla.variable}`}
    >
      <body className="font-sans antialiased">
        <noscript>
          {/* Without JavaScript the scroll-reveal never runs; show the content anyway. */}
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <Providers>
          <ScrollProgress />
          <ThemeColor />
          {children}
        </Providers>
        {isVercel && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
