import React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  hasFixedHeader?: boolean;
}

const AppLayout = ({ children, hasFixedHeader = false }: AppLayoutProps) => {
  return (
    <div className={cn(
      "p-4 md:p-8 max-w-6xl mx-auto space-y-8",
      // If SessionTimer is active, add top padding to prevent content overlap
      hasFixedHeader ? "pt-[100px]" : "pt-4 md:pt-8"
    )}>
      {children}
    </div>
  );
};

export default AppLayout;