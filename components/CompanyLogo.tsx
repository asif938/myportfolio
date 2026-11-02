"use client";

import { useState } from "react";
import Image from "next/image";
import { companyInitials } from "@/lib/experience";
import { cn } from "@/components/ui/cn";

/**
 * Company logo in a white tile (so dark logos stay visible in dark mode). Falls back to the
 * company's initials when there is no logo or the image fails to load.
 */
export default function CompanyLogo({
  company,
  url,
  size = 48,
  className,
}: {
  company: string;
  url?: string | null;
  size?: 48 | 28;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const big = size === 48;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-white font-display font-bold text-brand",
        big
          ? "h-12 w-12 rounded-[15px] p-1.5 text-base"
          : "h-7 w-7 rounded-lg border border-line p-1 text-[0.65rem]",
        className,
      )}
    >
      {url && !failed ? (
        <Image
          src={url}
          alt={`${company} logo`}
          width={size}
          height={size}
          sizes={`${size}px`}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span aria-hidden>{companyInitials(company)}</span>
      )}
    </span>
  );
}
