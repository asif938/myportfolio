/**
 * next/image loader that lets Cloudinary resize and convert images on its CDN
 * (instead of the Next.js image optimizer). Configured in next.config.js.
 *
 * - Raster images: f_auto (AVIF/WebP when the browser supports it), q_auto.
 * - SVGs: rasterized to WebP at the requested width. Some uploaded SVGs embed large
 *   bitmaps and weigh several MB; next/image would otherwise serve them untouched.
 * - Any non-Cloudinary URL is returned unchanged.
 */
const UPLOAD_MARKER = "/image/upload/";

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.startsWith("https://res.cloudinary.com/") || !src.includes(UPLOAD_MARKER)) {
    return src;
  }
  const isSvg = /\.svg(?:$|\?)/i.test(src);
  const transformations = [
    isSvg ? "f_webp" : "f_auto",
    quality ? `q_${quality}` : "q_auto",
    "c_limit",
    `w_${width}`,
  ].join(",");
  return src.replace(UPLOAD_MARKER, `${UPLOAD_MARKER}${transformations}/`);
}
