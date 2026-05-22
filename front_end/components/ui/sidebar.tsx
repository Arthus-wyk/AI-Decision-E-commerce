import * as React from "react";

import { cn } from "@/lib/utils";

function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <aside className={cn("border-b border-blue-100 bg-white md:min-h-[calc(100vh-4rem)] md:w-64 md:border-b-0 md:border-r", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-blue-100 p-4", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...props} />;
}

function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <nav className={cn("flex gap-1 overflow-x-auto md:grid md:overflow-visible", className)} {...props} />;
}

function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem };
