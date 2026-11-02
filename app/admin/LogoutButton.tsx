"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm font-medium text-danger hover:opacity-90"
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
