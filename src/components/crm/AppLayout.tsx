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
      fullWidth ? "p-8 max-w-none mx-auto space-y-8" : "p-4 md:p-8 max-w-full mx-auto space-y-8",
      // If SessionTimer is active, add top padding to prevent content overlap
      hasFixedHeader ? "pt-[100px]" : "pt-4 md:pt-8"
    )}>
      {children}
    </div>
  );
};

export default AppLayout;