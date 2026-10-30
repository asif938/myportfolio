import type { Profile } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Download, ArrowRight, Github, Linkedin, Facebook } from "lucide-react";

export default function Hero({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  return (
    <section
      id="home"
      tabIndex={-1}
      className="relative flex min-h-screen scroll-mt-16 items-center overflow-hidden pt-16 outline-none"
    >
      {/* Background Decor */}
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/20" />

      <div className="z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 space-y-8 lg:order-1">
            <div className="space-y-4">
              <p className="text-xl font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Hello, I am
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white min-[400px]:text-5xl sm:text-6xl">
                {profile.name}
              </h1>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                {profile.designation}
              </p>
              {profile.tagline && (
                <p className="max-w-xl whitespace-pre-line text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                  {profile.tagline}
                </p>
              )}
              {profile.availability && (
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  {profile.availability}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              {profile.resumeUrl ? (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:bg-indigo-500 hover:shadow-indigo-500/50"
                >
                  <Download size={18} />
                  Download Resume
                </a>
              ) : (
                <button
                  disabled
                  className="flex cursor-not-allowed items-center gap-2 rounded-full bg-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-500"
                >
                  <Download size={18} />
                  Resume Coming Soon
                </button>
              )}
              <Link
                href="#projects"
                className="flex items-center gap-2 rounded-full border-2 border-gray-200 px-8 py-3.5 text-sm font-semibold text-gray-900 transition-all hover:-translate-y-1 hover:border-gray-300 dark:border-gray-800 dark:text-white dark:hover:border-gray-700"
              >
                View Work <ArrowRight size={18} />
              </Link>
            </div>

            <div className="flex gap-6 pt-4">
              {profile.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
                >
                  <Github size={24} />
                  <span className="sr-only">GitHub</span>
                </a>
              )}
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <Linkedin size={24} />
                  <span className="sr-only">LinkedIn</span>
                </a>
              )}
              {profile.facebookUrl && (
                <a
                  href={profile.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 transition-colors hover:text-blue-500 dark:hover:text-blue-400"
                >
                  <Facebook size={24} />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
            </div>
          </div>

          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="relative h-64 w-64 min-[400px]:h-[350px] min-[400px]:w-[350px] sm:h-[450px] sm:w-[450px]">
              <div className="absolute inset-0 animate-[spin_20s_linear_infinite] rounded-full border-2 border-dashed border-indigo-200 dark:border-indigo-800" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur-2xl" />
              {profile.heroPhotoUrl ? (
                <Image
                  src={profile.heroPhotoUrl}
                  alt={profile.name}
                  fill
                  sizes="(min-width: 640px) 450px, (min-width: 400px) 350px, 256px"
                  className="rounded-full object-cover p-4 shadow-2xl"
                  priority
                />
              ) : (
                <div className="absolute inset-4 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 dark:bg-gray-800">
                  No Image Available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
