import { redirect } from "next/navigation";
import type React from "react";

import { getCurrentUser } from "@/actions/user";
import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }
  if (!user.is_superadmin) {
    redirect("/products");
  }

  return (
    <main className="flex w-full flex-1 flex-col md:flex-row">
      <AdminSidebar email={user.email} />
      <section className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</section>
    </main>
  );
}
