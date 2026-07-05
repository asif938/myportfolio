import Image from "next/image";

export default function Skills({ skills }: { skills: any[] }) {
  if (!skills || skills.length === 0) return null;

  const categories = Array.from(new Set(skills.map(s => s.category)));

  return (
    <section id="skills" className="py-24 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            My Skills
          </h2>
          <div className="mt-4 h-1 w-20 bg-indigo-600 mx-auto rounded-full" />
        </div>

        <div className="space-y-16">
          {categories.map(category => (
            <div key={category as string}>
              <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800 dark:text-gray-200">
                {category}
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                {skills.filter(s => s.category === category).map(skill => (
                  <div 
                    key={skill.id}
                    className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-md transition-shadow w-32 h-32 border border-gray-100 dark:border-gray-800 group"
                  >
                    {skill.imageUrl ? (
                      <div className="relative w-12 h-12 mb-3 group-hover:scale-110 transition-transform">
                        <Image src={skill.imageUrl} alt={skill.name} fill className="object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-400">
                        {skill.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
