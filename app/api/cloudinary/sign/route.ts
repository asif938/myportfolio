import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { CLOUDINARY_UPLOAD_FOLDER } from "@/lib/cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bodySchema = z.object({
  paramsToSign: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  ),
});

// Upload params that could run code, call out to other servers, or change the asset type.
const FORBIDDEN_PARAMS = new Set([
  "eval",
  "on_success",
  "notification_url",
  "eager_notification_url",
  "callback",
  "resource_type",
  "type",
  "access_mode",
  "overwrite",
  "invalidate",
]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    console.error("Cloudinary Sign Error: CLOUDINARY_API_SECRET is not set");
    return Response.json({ error: "Uploads are not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }
  const { paramsToSign } = parsed.data;

  const forbidden = Object.keys(paramsToSign).find((key) => FORBIDDEN_PARAMS.has(key));
  if (forbidden) {
    return Response.json({ error: `Parameter "${forbidden}" is not allowed` }, { status: 400 });
  }

  const folder = paramsToSign.folder ?? paramsToSign.asset_folder;
  if (folder !== CLOUDINARY_UPLOAD_FOLDER) {
    return Response.json(
      { error: `Uploads must go to the "${CLOUDINARY_UPLOAD_FOLDER}" folder` },
      { status: 400 },
    );
  }

  try {
    const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);
    return Response.json({ signature });
  } catch (error) {
    console.error("Cloudinary Sign Error:", error);
    return Response.json({ error: "Failed to sign" }, { status: 500 });
  }
}
