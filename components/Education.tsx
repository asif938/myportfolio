import type { Education as EducationEntry } from "@prisma/client";

export default function Education({ education }: { education: EducationEntry[] }) {
  if (!education || education.length === 0) return null;

  return (
    <section id="education" className="bg-white py-24 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Education
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </div>

        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent md:before:mx-auto md:before:translate-x-0 dark:before:via-gray-700">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="is-active group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
            >
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-indigo-500 text-white shadow md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:border-gray-900">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
              <div className="w-[calc(100%-4rem)] rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:w-[calc(50%-2.5rem)] dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex flex-col justify-between sm:flex-row sm:items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{edu.degree}</h3>
                  <time className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {edu.startYear} - {edu.endYear}
                  </time>
                </div>
                <div className="text-md mb-2 font-medium text-gray-700 dark:text-gray-300">
                  {edu.institution}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{edu.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
