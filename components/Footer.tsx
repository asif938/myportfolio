import type { Profile } from "@prisma/client";
import { Github, Linkedin, Facebook } from "lucide-react";

export default function Footer({ profile }: { profile: Profile | null }) {
  if (!profile) return null;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex gap-6">
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              <Github size={20} />
              <span className="sr-only">GitHub</span>
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Linkedin size={20} />
              <span className="sr-only">LinkedIn</span>
            </a>
          )}
          {profile.facebookUrl && (
            <a
              href={profile.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-blue-500 dark:hover:text-blue-400"
            >
              <Facebook size={20} />
              <span className="sr-only">Facebook</span>
            </a>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {year} {profile.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
