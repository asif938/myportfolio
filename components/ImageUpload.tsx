"use client";

import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud } from "lucide-react";

interface ImageUploadProps {
  onUploadAction: (url: string) => void;
  buttonText?: string;
}

export default function ImageUpload({ onUploadAction, buttonText = "Upload Image" }: ImageUploadProps) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      onSuccess={(result: any) => {
        if (result?.info?.secure_url) {
          onUploadAction(result.info.secure_url);
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
