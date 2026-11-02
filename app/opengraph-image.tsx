import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/data";
import { OG_SIZE, OgFrame, cloudinaryJpeg } from "@/lib/ogImage";
import { truncate } from "@/lib/site";

export const alt = "Portfolio preview";
export const size = OG_SIZE;
export const contentType = "image/png";
// Rendered on request, not at build: the next/og copy in Next 14 crashes on Windows paths
// during local builds (works on Linux, e.g. Vercel). See the Phase 4 notes.
export const dynamic = "force-dynamic";

export default async function OpenGraphImage() {
  const profile = await getProfile();
  const name = profile?.name ?? "Portfolio";
  const photo = cloudinaryJpeg(profile?.heroPhotoUrl ?? null, 320, 320);

  return new ImageResponse(
    <OgFrame>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 80px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 30, color: "#c7d2fe", letterSpacing: 4 }}>PORTFOLIO</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 16 }}>
            {name}
          </div>
          {profile?.designation && (
            <div style={{ fontSize: 40, color: "#e0e7ff", marginTop: 16 }}>
              {profile.designation}
            </div>
          )}
          {profile?.tagline && (
            <div style={{ fontSize: 26, color: "#c7d2fe", marginTop: 28, lineHeight: 1.4 }}>
              {truncate(profile.tagline, 140)}
            </div>
          )}
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={320}
            height={320}
            style={{ borderRadius: 9999, border: "8px solid rgba(255,255,255,0.25)" }}
          />
        )}
      </div>
    </OgFrame>,
    size,
  );
}
