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
      fullWidth ? "p-6 max-w-none mx-auto space-y-6" : "p-3 md:p-6 max-w-full mx-auto space-y-6",
      // If SessionTimer is active, add top padding to prevent content overlap
      hasFixedHeader ? "pt-[80px]" : "pt-3 md:pt-6"
    )}>
      {children}
    </div>
  );
};

export default AppLayout;