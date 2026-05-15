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
      "flex flex-col min-h-screen transition-all duration-1000 relative overflow-hidden",
      mode === 'clinical' ? "bg-white dark:bg-slate-950" :
      mode === 'lab' ? "bg-slate-50/50 dark:bg-slate-950" :
      "bg-slate-50/50 dark:bg-slate-950"
    )}>
      {/* SUBTLE BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute top-[-15%] left-[-5%] w-[50%] h-[50%] blur-[140px] rounded-full transition-all duration-1000 opacity-10 dark:opacity-5",
          mode === 'clinical' ? "bg-indigo-200" : mode === 'lab' ? "bg-emerald-200" : "bg-amber-200"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] blur-[120px] rounded-full transition-all duration-1000 opacity-10 dark:opacity-5 delay-500",
          mode === 'clinical' ? "bg-blue-100" : mode === 'lab' ? "bg-teal-100" : "bg-orange-100"
        )} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
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
      </div>
      <QuickActions />
      <BackToTop />
    </div>
  );
};

export default MainLayout;