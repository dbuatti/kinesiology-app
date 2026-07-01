
import type { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  // Standardized max-width hierarchy
  const maxWidthClass = 
    variant === "full" ? "max-w-none" : 
    variant === "wide" ? "max-w-[1600px]" :
    variant === "workspace" ? "max-w-7xl" : 
    "max-w-6xl";

  return (
    <div
      className={cn(
        "w-full min-h-screen mx-auto px-4 md:px-8 transition-all duration-500",
        hasFixedHeader ? "pt-16 md:pt-20 pb-8 md:pb-10" : "pt-3 md:pt-5 pb-8 md:pb-10",
        maxWidthClass,
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.23, 1, 0.32, 1] 
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;