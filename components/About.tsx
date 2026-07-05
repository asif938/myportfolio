import Image from "next/image";

export default function About({ profile }: { profile: any }) {
  if (!profile) return null;

  return (
    <section id="about" className="py-24 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            About Me
          </h2>
          <div className="mt-4 h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
          <div className="flex justify-center">
            <div className="relative h-96 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
              {profile.aboutPhotoUrl ? (
                <Image
                  src={profile.aboutPhotoUrl}
                  alt={`About ${profile.name}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Journey as a {profile.designation}
            </h3>
            <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300">
              <p className="whitespace-pre-line">{profile.aboutMe}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
              {profile.email && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Email</h4>
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Phone</h4>
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
