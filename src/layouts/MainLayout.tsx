"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceHeader from '@/components/crm/SpaceHeader';
import QuickActions from '@/components/crm/QuickActions';
import AppFooter from '@/components/crm/AppFooter';
import BackToTop from '@/components/shared/BackToTop';
import UpcomingMarquee from '@/components/crm/UpcomingMarquee';
import { useAppMode } from '@/components/ModeProvider';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { mode } = useAppMode();

  return (
    <div className={cn(
      "flex flex-col min-h-screen transition-colors duration-700",
      mode === 'clinical' ? "bg-white dark:bg-slate-950" : 
      mode === 'lab' ? "bg-emerald-50/30 dark:bg-slate-950" : 
      "bg-amber-50/30 dark:bg-slate-950"
    )}>
      <UpcomingMarquee />
      <SpaceHeader />
      
      <div className="flex flex-col flex-1">
        <main id="main-scroll-container" className="flex-1 flex flex-col overflow-auto relative">
          <div className="flex-1 p-0">
            <Outlet />
          </div>
          
          <AppFooter />
        </main>
      </div>
      <QuickActions />
      <BackToTop />
    </div>
  );
};

export default MainLayout;