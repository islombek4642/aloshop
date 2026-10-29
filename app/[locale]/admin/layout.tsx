import * as React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isLoginPage = pathname.includes("/admin/login");

  const session = await getAdminSession();

  // If visiting login page, render clean container without sidebar/header
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    );
  }

  // If no session on protected admin routes, redirect to login
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  // Render full Admin Shell
  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950">
      {/* Desktop Persistent Sidebar */}
      <AdminSidebar
        session={session}
        className="hidden md:flex min-h-screen sticky top-0"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader session={session} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
