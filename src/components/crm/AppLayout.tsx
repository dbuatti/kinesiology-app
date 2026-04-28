"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

type LayoutVariant = "standard" | "workspace" | "wide" | "full";

interface AppLayoutProps {
  children: React.ReactNode;
  variant?: LayoutVariant;
  hasFixedHeader?: boolean;
  className?: string;
  /** Override default max-width */
  maxWidth?: string;
  /** Custom padding (overrides default) */
  padding?: string;
  /** Disable page transition animation */
  disableAnimation?: boolean;
  /** Custom animation variants */
  animation?: {
    initial?: object;
    animate?: object;
    exit?: object;
    transition?: object;
  };
}

const AppLayout = ({
  children,
  variant = "standard",
  hasFixedHeader = false,
  className,
  maxWidth,
  padding,
  disableAnimation = false,
  animation,
}: AppLayoutProps) => {
  const location = useLocation();

  // Max-width mapping
  const maxWidthClasses = {
    standard: "max-w-5xl", // ~1024px - Good for most content
    workspace: "max-w-7xl", // ~1280px - Data-heavy pages
    wide: "max-w-[1400px]", // Extra wide for dashboards
    full: "max-w-full", // Full bleed layout
  };

  // Default horizontal padding
  const defaultPadding = "px-6 md:px-8 lg:px-10";

  const finalMaxWidth = maxWidth || maxWidthClasses[variant];
  const finalPadding = padding || defaultPadding;

  const defaultAnimation = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }, // Smooth custom easing
  };

  const pageVariants = animation || defaultAnimation;

  return (
    <div
      className={cn(
        "w-full min-h-screen bg-background",
        "mx-auto transition-all duration-300",
        finalPadding,
        hasFixedHeader ? "pt-24 pb-24" : "pt-12 pb-20",
        finalMaxWidth,
        className
      )}
    >
      <AnimatePresence mode="wait">
        {!disableAnimation ? (
          <motion.div
            key={location.pathname}
            initial={pageVariants.initial}
            animate={pageVariants.animate}
            exit={pageVariants.exit}
            transition={pageVariants.transition}
            className="w-full"
          >
            {children}
          </motion.div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;