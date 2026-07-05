import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-white shadow-md dark:bg-gray-800">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Panel</h1>
        </div>
        <nav className="mt-6 space-y-1 px-4">
          <Link href="/admin" className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            Dashboard
          </Link>
          <Link href="/admin/profile" className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            Profile & Hero
          </Link>
          <Link href="/admin/skills" className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            Skills
          </Link>
          <Link href="/admin/projects" className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            Projects
          </Link>
          <Link href="/admin/education" className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
            Education
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-gray-200 p-4 dark:border-gray-700">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}
