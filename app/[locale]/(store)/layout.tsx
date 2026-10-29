import * as React from "react";
import { StoreHeader } from "@/components/store/header";
import { MobileNav } from "@/components/store/mobile-nav";
import { StoreFooter } from "@/components/store/footer";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <StoreFooter />
      <MobileNav />
    </div>
  );
}

