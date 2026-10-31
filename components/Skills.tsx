import type { Skill } from "@prisma/client";
import Image from "next/image";
import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Skills({ skills }: { skills: Skill[] }) {
  if (!skills || skills.length === 0) return null;

  const categories = Array.from(new Set(skills.map((s) => s.category)));

  return (
    <Section id="skills" backdrop={<Atmosphere variant="soft" side="left" />}>
      <Reveal>
        <SectionHeading eyebrow="Skills" title="My Skills" highlight="Skills" />
      </Reveal>

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {categories.map((category, i) => (
          <Reveal as="li" key={category} delay={(i % 2) * 0.08} className="flex">
            <Card tint={i} className="w-full p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="font-display text-sm font-bold tabular-nums" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl font-bold sm:text-2xl">{category}</h3>
              </div>
              <ul className="flex flex-wrap gap-2.5">
                {skills
                  .filter((s) => s.category === category)
                  .map((skill) => (
                    <li key={skill.id}>
                      <Chip className="transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:border-brand">
                        {skill.imageUrl ? (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white p-0.5">
                            <Image src={skill.imageUrl} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-gradient-deep text-xs font-bold text-white"
                          >
                            {skill.name.charAt(0)}
                          </span>
                        )}
                        {skill.name}
                      </Chip>
                    </li>
                  ))}
              </ul>
            </Card>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
