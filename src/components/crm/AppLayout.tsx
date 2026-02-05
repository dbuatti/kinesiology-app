import React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  // Removed hasFixedHeader prop as it's no longer needed for padding calculation
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className={cn(
      "p-4 md:p-8 max-w-6xl mx-auto space-y-8",
      "pt-4 md:pt-8" // Base padding
    )}>
      {children}
    </div>
  );
};

export default AppLayout;