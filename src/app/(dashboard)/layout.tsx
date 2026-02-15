"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const user = session?.user as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen">
      <Sidebar
        restaurantName={user?.restaurantName as string}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main
        className={`transition-all pb-20 md:pb-0 ${
          collapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
