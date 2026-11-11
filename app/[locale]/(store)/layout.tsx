import * as React from "react";
import { StoreHeader } from "@/components/store/header";
import { MobileNav } from "@/components/store/mobile-nav";
import { StoreFooter } from "@/components/store/footer";
import { AnnouncementBanner } from "@/components/store/announcement-banner";
import { getSiteSettings } from "@/lib/settings/site-settings";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default async function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const settings = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBanner announcement={settings?.announcementBanner} />
      <StoreHeader settings={settings} />
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">{children}</main>
      <StoreFooter settings={settings} />
      <MobileNav />
    </div>
  );
}
