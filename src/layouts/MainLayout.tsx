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
      mode === 'clinical' ? "bg-slate-50 dark:bg-slate-950" :
      mode === 'lab' ? "bg-emerald-50/20 dark:bg-slate-950" :
      "bg-amber-50/20 dark:bg-slate-950"
    )}>
      {/* DYNAMIC BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-all duration-1000 opacity-30 dark:opacity-10 animate-pulse",
          mode === 'clinical' ? "bg-indigo-400/40" : mode === 'lab' ? "bg-emerald-400/40" : "bg-amber-400/40"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[100px] rounded-full transition-all duration-1000 opacity-20 dark:opacity-5 delay-500 animate-pulse",
          mode === 'clinical' ? "bg-blue-400/30" : mode === 'lab' ? "bg-teal-400/30" : "bg-orange-400/30"
        )} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
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