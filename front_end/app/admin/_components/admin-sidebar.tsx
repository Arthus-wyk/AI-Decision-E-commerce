"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, ShoppingBag, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/overview", label: "Overview", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <p className="text-sm font-extrabold text-slate-950">Admin</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu aria-label="Admin navigation">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <Button
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-slate-600 hover:text-blue-900 md:h-10",
                    active && "bg-blue-50 text-blue-800",
                  )}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
