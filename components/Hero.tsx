import Image from "next/image";
import Link from "next/link";
import { Download, ArrowRight, Github, Linkedin, Facebook } from "lucide-react";

export default function Hero({ profile }: { profile: any }) {
  if (!profile) return null;

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden pt-16">
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/20" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-medium tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
                Hello, I am
              </h2>
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                {profile.name}
              </h1>
              <p className="text-2xl font-semibold text-gray-600 dark:text-gray-300">
                {profile.designation}
              </p>
              <p className="max-w-xl text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                {profile.aboutMe.substring(0, 150)}...
              </p>
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
                  className="flex items-center gap-2 rounded-full bg-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
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
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <Github size={24} />
                  <span className="sr-only">GitHub</span>
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Linkedin size={24} />
                  <span className="sr-only">LinkedIn</span>
                </a>
              )}
              {profile.facebookUrl && (
                <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                  <Facebook size={24} />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative h-[350px] w-[350px] sm:h-[450px] sm:w-[450px]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-200 dark:border-indigo-800 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 blur-2xl" />
              {profile.heroPhotoUrl ? (
                <Image
                  src={profile.heroPhotoUrl}
                  alt={profile.name}
                  fill
                  className="rounded-full object-cover shadow-2xl p-4"
                  priority
                />
              ) : (
                <div className="absolute inset-4 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400">
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
