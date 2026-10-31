"use client";

import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud } from "lucide-react";
import { ALLOWED_IMAGE_FORMATS, CLOUDINARY_UPLOAD_FOLDER } from "@/lib/cloudinary";

interface ImageUploadProps {
  onUploadAction: (url: string) => void;
  buttonText?: string;
  /** Allow selecting several files; onUploadAction is called once per uploaded file. */
  multiple?: boolean;
}

export default function ImageUpload({
  onUploadAction,
  buttonText = "Upload Image",
  multiple = false,
}: ImageUploadProps) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        folder: CLOUDINARY_UPLOAD_FOLDER,
        resourceType: "image",
        clientAllowedFormats: ALLOWED_IMAGE_FORMATS,
        maxFileSize: 10_000_000,
        multiple,
        maxFiles: multiple ? 20 : 1,
      }}
      onSuccess={(result) => {
        const info = result?.info;
        if (info && typeof info === "object" && typeof info.secure_url === "string") {
          onUploadAction(info.secure_url);
        }
      }}
    >
      {({ open }) => {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              open();
            }}
            className="flex items-center gap-2 rounded-md bg-surface-2 px-4 py-2 text-sm font-medium text-accent hover:bg-line"
          >
            <UploadCloud size={16} />
            {buttonText}
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
