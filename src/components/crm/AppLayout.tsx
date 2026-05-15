"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  hasFixedHeader?: boolean;
  className?: string;
  variant?: "standard" | "workspace" | "wide" | "full";
}

const AppLayout = ({
  children,
  hasFixedHeader = false,
  className,
  variant = "standard",
}: AppLayoutProps) => {
  const maxWidthClass = variant === "full" ? "max-w-none" : "max-w-[1440px]";

  return (
    <div
      className={cn(
        "w-full min-h-screen mx-auto px-6 transition-all duration-300",
        hasFixedHeader ? "pt-2 pb-8" : "pt-4 pb-8",
        maxWidthClass,
        className
      )}
    >
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;