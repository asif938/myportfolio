export default function Education({ education }: { education: any[] }) {
  if (!education || education.length === 0) return null;

  return (
    <section id="education" className="py-24 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            Education
          </h2>
          <div className="mt-4 h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
        </div>

        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
          {education.map((edu, index) => (
            <div key={edu.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{edu.degree}</h3>
                  <time className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {edu.startYear} - {edu.endYear}
                  </time>
                </div>
                <div className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {edu.institution}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {edu.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
