
import type { ReactNode } from 'react';
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
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
  // Standardized max-width hierarchy
  const maxWidthClass = 
    variant === "full" ? "max-w-none" : 
    variant === "wide" ? "max-w-[1600px]" :
    variant === "workspace" ? "max-w-7xl" : 
    "max-w-none";

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        hasFixedHeader ? "pt-16 md:pt-20 pb-10 md:pb-14" : "pt-5 sm:pt-6 lg:pt-8 pb-10 md:pb-14",
        maxWidthClass,
        className
      )}
    >
      {/* Route entrance is handled once, by MainLayout's .page-enter */}
      {children}
    </div>
  );
};

export default AppLayout;