"use client";

import { useState } from "react";
import Image from "next/image";
import type { SkillTabs } from "@/lib/skillTabs";
import { tintClass } from "@/components/ui/Card";

/** Tabbed skill wall. All panels share one grid cell so the area never changes height. */
export default function SkillsWall({ data }: { data: SkillTabs }) {
  const [active, setActive] = useState("all");
  const { tabs, categories, showTabs } = data;

  return (
    <div>
      {showTabs && (
        <div
          role="group"
          aria-label="Skill categories"
          className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10 sm:gap-2.5"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={active === tab.id}
              onClick={() => setActive(tab.id)}
              className="skill-tab inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold sm:px-4 sm:py-2"
            >
              {tab.label}
              <span className="skill-badge rounded-full px-2 py-0.5 text-xs font-bold tabular-nums">
                {tab.skills.length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto grid max-w-[1000px]">
        {tabs.map((tab) => (
          <ul
            key={tab.id}
            data-active={!showTabs ? tab.id === "all" : active === tab.id}
            className="skill-panel skill-grid grid content-start gap-2.5 sm:gap-3.5"
          >
            {tab.skills.map((skill) => {
              const category = categories.indexOf(skill.category);
              return (
                <li
                  key={skill.id}
                  className="skill-tile relative flex flex-col items-center gap-2.5 rounded-[22px] px-2 pb-3.5 pt-5 text-center sm:gap-3 sm:px-3 sm:pb-4 sm:pt-6"
                >
                  <span
                    role="img"
                    aria-label={`Category: ${skill.category}`}
                    title={skill.category}
                    className={`${tintClass(category)} absolute right-3 top-3 h-2 w-2 rounded-full bg-t-fg`}
                  />
                  {skill.imageUrl ? (
                    <span className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-white p-1.5">
                      <Image
                        src={skill.imageUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-brand-gradient-deep text-lg font-bold text-white"
                    >
                      {skill.name.charAt(0)}
                    </span>
                  )}
                  <span className="break-words text-xs font-semibold leading-snug text-fg sm:text-sm">
                    {skill.name}
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
