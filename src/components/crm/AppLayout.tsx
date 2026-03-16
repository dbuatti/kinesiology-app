"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  hasFixedHeader?: boolean;
  fullWidth?: boolean;
}

const AppLayout = ({ children, hasFixedHeader = false, fullWidth = false }: AppLayoutProps) => {
  return (
    <div className={cn(
      "w-full min-h-screen bg-background transition-all duration-500",
      fullWidth ? "px-6 py-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
      hasFixedHeader ? "pt-24" : "pt-8"
    )}>
      {children}
    </div>
  );
};

export default AppLayout;