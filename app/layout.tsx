import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import { getProfile, getSkills } from "@/lib/data";
import { SITE_URL, truncate } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the theme class on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <noscript>
          {/* Without JavaScript the scroll-reveal never runs; show the content anyway. */}
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <Providers>{children}</Providers>
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
