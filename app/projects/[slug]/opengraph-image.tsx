import { ImageResponse } from "next/og";
import { getProfile, getProjectBySlug } from "@/lib/data";
import { OG_SIZE, OgFrame, cloudinaryJpeg } from "@/lib/ogImage";
import { truncate } from "@/lib/site";

export const alt = "Project preview";
export const size = OG_SIZE;
export const contentType = "image/png";
// Rendered on request, not at build: the next/og copy in Next 14 crashes on Windows paths
// during local builds (works on Linux, e.g. Vercel). See the Phase 4 notes.
export const dynamic = "force-dynamic";

export default async function ProjectOpenGraphImage({ params }: { params: { slug: string } }) {
  const [project, profile] = await Promise.all([getProjectBySlug(params.slug), getProfile()]);
  const cover = cloudinaryJpeg(project?.imageUrl ?? null, 520, 630);

  return new ImageResponse(
    <OgFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 64px",
          flex: 1,
        }}
      >
        <div style={{ fontSize: 26, color: "#c7d2fe", letterSpacing: 3 }}>PROJECT</div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginTop: 12 }}>
          {project?.name ?? "Project"}
        </div>
        {project && (
          <div style={{ fontSize: 26, color: "#e0e7ff", marginTop: 20, lineHeight: 1.4 }}>
            {truncate(project.description, 120)}
          </div>
        )}
        {project && project.mainTechStack.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 28 }}>
            {project.mainTechStack.slice(0, 5).map((tech) => (
              <div
                key={tech}
                style={{
                  fontSize: 22,
                  padding: "6px 16px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        )}
        {profile?.name && (
          <div style={{ fontSize: 24, color: "#c7d2fe", marginTop: 36 }}>by {profile.name}</div>
        )}
      </div>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" width={520} height={630} style={{ objectFit: "cover" }} />
      )}
    </OgFrame>,
    size,
  );
}
