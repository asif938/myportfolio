"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { updateProfile } from "@/app/actions/profileActions";
import Image from "next/image";
import type { Profile } from "@prisma/client";
import type { ProfileInput } from "@/lib/validations";
import { runAdminAction } from "@/lib/adminFeedback";
import { primaryButtonClass } from "../formStyles";

type ProfileFormState = Required<{ [K in keyof ProfileInput]: NonNullable<ProfileInput[K]> }>;

function toFormState(profile: Profile | null): ProfileFormState {
  return {
    name: profile?.name ?? "",
    designation: profile?.designation ?? "",
    aboutMe: profile?.aboutMe ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    showPhone: profile?.showPhone ?? false,
    whatsapp: profile?.whatsapp ?? "",
    resumeUrl: profile?.resumeUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    facebookUrl: profile?.facebookUrl ?? "",
    heroPhotoUrl: profile?.heroPhotoUrl ?? "",
    aboutPhotoUrl: profile?.aboutPhotoUrl ?? "",
  };
}

export default function ProfileAdmin({ initialProfile }: { initialProfile: Profile | null }) {
  const [formData, setFormData] = useState<ProfileFormState>(() => toFormState(initialProfile));

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await runAdminAction(() => updateProfile(formData), "Profile saved");
    setSaving(false);
  };

  return (
    <div className="max-w-4xl rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white">Profile & Hero Section</h2>
      
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Images */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Hero Section Photo</label>
            {formData.heroPhotoUrl && (
              <div className="mb-2">
                <Image src={formData.heroPhotoUrl} alt="Hero" width={100} height={100} className="rounded-full object-cover" />
              </div>
            )}
            <ImageUpload 
              buttonText="Upload Hero Photo" 
              onUploadAction={(url) => setFormData((f) => ({ ...f, heroPhotoUrl: url }))} 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">About Section Photo</label>
            {formData.aboutPhotoUrl && (
              <div className="mb-2">
                <Image src={formData.aboutPhotoUrl} alt="About" width={100} height={100} className="rounded-lg object-cover" />
              </div>
            )}
            <ImageUpload 
              buttonText="Upload About Photo" 
              onUploadAction={(url) => setFormData((f) => ({ ...f, aboutPhotoUrl: url }))} 
            />
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Designation</label>
            <input type="text" name="designation" value={formData.designation || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">About Me</label>
            <textarea name="aboutMe" rows={4} value={formData.aboutMe || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="showPhone"
                checked={formData.showPhone}
                onChange={(e) => setFormData({ ...formData, showPhone: e.target.checked })}
              />
              Show phone number on the public site
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium">WhatsApp</label>
            <input type="text" name="whatsapp" value={formData.whatsapp || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Resume PDF URL</label>
            <input type="text" name="resumeUrl" value={formData.resumeUrl || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>

          {/* Social */}
          <div>
            <label className="block text-sm font-medium">GitHub URL</label>
            <input type="text" name="githubUrl" value={formData.githubUrl || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">LinkedIn URL</label>
            <input type="text" name="linkedinUrl" value={formData.linkedinUrl || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium">Facebook URL</label>
            <input type="text" name="facebookUrl" value={formData.facebookUrl || ""} onChange={handleChange} className="mt-1 block w-full rounded-md border p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>

        <button type="submit" disabled={saving} className={`mt-4 ${primaryButtonClass}`}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
