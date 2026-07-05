"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { updateProfile } from "@/app/actions/profileActions";
import Image from "next/image";

export default function ProfileAdmin({ initialProfile }: { initialProfile: any }) {
  const [formData, setFormData] = useState(initialProfile || {
    name: "", designation: "", aboutMe: "", email: "", phone: "", whatsapp: "",
    resumeUrl: "", githubUrl: "", linkedinUrl: "", facebookUrl: "", heroPhotoUrl: "", aboutPhotoUrl: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateProfile(formData);
      setMessage("Profile saved successfully!");
    } catch (err) {
      setMessage("Error saving profile.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl rounded-lg bg-white p-8 shadow-sm dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800 dark:text-white">Profile & Hero Section</h2>
      
      {message && <div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">{message}</div>}
      
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
              onUploadAction={(url) => setFormData({ ...formData, heroPhotoUrl: url })} 
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
              onUploadAction={(url) => setFormData({ ...formData, aboutPhotoUrl: url })} 
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

        <button type="submit" disabled={saving} className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
