/** Shared pieces for the Open Graph images (rendered by next/og, so only flexbox CSS). */

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Cloudinary URL resized/cropped and converted to JPEG, which the OG renderer can read
 * (it doesn't support WebP/AVIF). Returns null for anything that isn't a Cloudinary upload.
 */
export function cloudinaryJpeg(url: string | null, width: number, height: number): string | null {
  if (!url || !url.startsWith("https://res.cloudinary.com/") || !url.includes("/image/upload/")) {
    return null;
  }
  return url.replace("/image/upload/", `/image/upload/f_jpg,q_80,c_fill,w_${width},h_${height}/`);
}

export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #6d28d9 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );
}
