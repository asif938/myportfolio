"use client";

import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud } from "lucide-react";
import { ALLOWED_IMAGE_FORMATS, CLOUDINARY_UPLOAD_FOLDER } from "@/lib/cloudinary";

interface ImageUploadProps {
  onUploadAction: (url: string) => void;
  buttonText?: string;
}

export default function ImageUpload({ onUploadAction, buttonText = "Upload Image" }: ImageUploadProps) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        folder: CLOUDINARY_UPLOAD_FOLDER,
        resourceType: "image",
        clientAllowedFormats: ALLOWED_IMAGE_FORMATS,
        maxFileSize: 10_000_000,
        multiple: false,
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
            className="flex items-center gap-2 rounded-md bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
          >
            <UploadCloud size={16} />
            {buttonText}
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
