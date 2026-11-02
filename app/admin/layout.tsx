import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [unreadMessages, unreadConversations] = await Promise.all([
    prisma.message.count({ where: { read: false } }),
    prisma.conversation.count({
      where: { OR: [{ unreadByAdmin: true }, { status: "needs_human" }] },
    }),
  ]);

  return (
    <AdminShell unreadMessages={unreadMessages} unreadConversations={unreadConversations}>
      {children}
    </AdminShell>
  );
}
