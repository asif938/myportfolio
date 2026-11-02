import type { Profile } from "@prisma/client";
import AboutPhoto from "@/components/AboutPhoto";
import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";

type Contact = { label: string; value: string; href?: string; Icon: LucideIcon };

export default function About({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  const contacts: Contact[] = [];
  if (profile.email) {
    contacts.push({
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      Icon: Mail,
    });
  }
  if (profile.showPhone && profile.phone) {
    contacts.push({
      label: "Phone",
      value: profile.phone,
      href: `tel:${profile.phone.replace(/\s+/g, "")}`,
      Icon: Phone,
    });
  }
  if (profile.location) {
    contacts.push({ label: "Location", value: profile.location, Icon: MapPin });
  }

  return (
    <Section id="about" backdrop={<Atmosphere variant="soft" side="right" />}>
      <Reveal>
        <SectionHeading eyebrow="About" title="About Me" highlight="Me" />
      </Reveal>

      <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="space-y-6 lg:col-start-2 lg:row-start-1">
          <h3 className="text-2xl font-bold text-fg sm:text-3xl">
            My Journey as a {profile.designation}
          </h3>
          <p className="max-w-[65ch] whitespace-pre-line text-base leading-[1.7] text-muted sm:text-lg">
            {profile.aboutMe}
          </p>

          {contacts.length > 0 && (
            <ul className="flex flex-wrap gap-3 pt-2">
              {contacts.map(({ label, value, href, Icon }) => {
                const inner = (
                  <>
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient-deep text-white"
                      aria-hidden
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                        {label}
                      </span>
                      <span className="block break-all text-sm font-medium text-fg">{value}</span>
                    </span>
                  </>
                );
                const cls =
                  "flex max-w-full items-center gap-3 rounded-full border border-line bg-surface py-2 pl-2 pr-5 shadow-card backdrop-blur-md";
                return (
                  <li key={label} className="max-w-full">
                    {href ? (
                      <a
                        href={href}
                        className={`${cls} transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-center lg:col-start-1 lg:row-start-1">
          <AboutPhoto name={profile.name} photoUrl={profile.aboutPhotoUrl} />
        </div>
      </Reveal>
    </Section>
  );
}
