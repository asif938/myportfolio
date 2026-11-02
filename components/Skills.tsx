import type { Skill } from "@prisma/client";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import SkillsWall from "@/components/SkillsWall";
import { buildSkillTabs } from "@/lib/skillTabs";

/** Pure-CSS glows behind the content (radial gradients, no blur filter). */
function BandGlows() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full"
        style={{
          background: "radial-gradient(closest-side, var(--skills-band-glow-1), transparent)",
        }}
      />
      <div
        className="absolute -bottom-24 -left-24 hidden h-[360px] w-[360px] rounded-full sm:block"
        style={{
          background: "radial-gradient(closest-side, var(--skills-band-glow-2), transparent)",
        }}
      />
    </div>
  );
}

/** Full-width deep violet band (tokens come from `.band` + `.skills-band`). */
export default function Skills({ skills }: { skills: Skill[] }) {
  if (!skills || skills.length === 0) return null;

  const data = buildSkillTabs(skills);

  return (
    <section
      id="skills"
      tabIndex={-1}
      className="band skills-band relative scroll-mt-24 overflow-hidden pb-[52px] pt-12 outline-none sm:pb-[72px] sm:pt-16"
    >
      <BandGlows />
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Skills"
            title="My Skills"
            highlight="Skills"
            className="!mb-8 sm:!mb-10"
          />
        </Reveal>
        <Reveal>
          <SkillsWall data={data} />
        </Reveal>
      </div>
    </section>
  );
}
