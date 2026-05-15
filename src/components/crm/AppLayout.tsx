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
  // Determine max width based on variant
  const maxWidthClass = variant === "full" ? "max-w-none" : "max-w-7xl";

  return (
    <div
      className={cn(
        "w-full min-h-screen mx-auto px-8 transition-all duration-300",
        hasFixedHeader ? "pt-16 pb-16" : "pt-8 pb-16",
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