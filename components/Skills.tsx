import type { Skill } from "@prisma/client";
import Image from "next/image";
import Reveal from "@/components/Reveal";

export default function Skills({ skills }: { skills: Skill[] }) {
  if (!skills || skills.length === 0) return null;

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <section
      id="skills"
      tabIndex={-1}
      className="scroll-mt-16 bg-gray-50 py-24 outline-none dark:bg-gray-950"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            My Skills
          </h2>
          <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-indigo-600" />
        </Reveal>

        <div className="space-y-16">
          {categories.map((category) => (
            <Reveal key={category}>
              <h3 className="mb-8 text-center text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {category}
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <div
                      key={skill.id}
                      className="group flex h-32 w-32 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                      {skill.imageUrl ? (
                        <div className="relative mb-3 h-12 w-12 transition-transform group-hover:scale-110">
                          <Image
                            src={skill.imageUrl}
                            alt={skill.name}
                            fill
                            sizes="48px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <span aria-hidden="true">{skill.name.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        {skill.name}
                      </span>
                    </div>
                  ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
