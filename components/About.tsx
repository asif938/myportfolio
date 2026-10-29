import type { Profile } from "@prisma/client";
import Image from "next/image";

export default function About({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  return (
    <section id="about" className="bg-white py-24 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            About Me
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="flex justify-center">
            <div className="relative h-96 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
              {profile.aboutPhotoUrl ? (
                <Image
                  src={profile.aboutPhotoUrl}
                  alt={`About ${profile.name}`}
                  fill
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500 dark:bg-gray-800">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Journey as a {profile.designation}
            </h3>
            <div className="prose prose-lg max-w-none text-gray-600 dark:prose-invert dark:text-gray-300">
              <p className="whitespace-pre-line">{profile.aboutMe}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 border-t border-gray-200 pt-6 dark:border-gray-800">
              {profile.email && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                    Email
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                </div>
              )}
              {profile.showPhone && profile.phone && (
                <div>
                  <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white">
                    Phone
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
