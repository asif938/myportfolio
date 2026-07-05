import { Github, Linkedin, Facebook } from "lucide-react";

export default function Footer({ profile }: { profile: any }) {
  if (!profile) return null;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 py-12 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="flex gap-6 mb-8">
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Github size={20} />
              <span className="sr-only">GitHub</span>
            </a>
          )}
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Linkedin size={20} />
              <span className="sr-only">LinkedIn</span>
            </a>
          )}
          {profile.facebookUrl && (
            <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
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
