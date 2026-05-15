"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceHeader from '@/components/crm/SpaceHeader';
import QuickActions from '@/components/crm/QuickActions';
import AppFooter from '@/components/crm/AppFooter';
import BackToTop from '@/components/shared/BackToTop';
import UpcomingMarquee from '@/components/crm/UpcomingMarquee';
import SessionTimer from '@/components/crm/SessionTimer';
import { useAppMode } from '@/components/ModeProvider';
import { useActiveSession } from '@/hooks/useActiveSession';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { mode } = useAppMode();
  const activeSession = useActiveSession();

  return (
    <div className={cn(
      "flex flex-col min-h-screen transition-all duration-1000 relative overflow-hidden",
      mode === 'clinical' ? "bg-white dark:bg-slate-950" :
      mode === 'lab' ? "bg-slate-50/50 dark:bg-slate-950" :
      "bg-slate-50/50 dark:bg-slate-950"
    )}>
      {/* SOPHISTICATED BACKGROUND ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[160px] rounded-full transition-all duration-1000 opacity-20 dark:opacity-10",
          mode === 'clinical' ? "bg-indigo-300" : mode === 'lab' ? "bg-emerald-300" : "bg-amber-300"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[140px] rounded-full transition-all duration-1000 opacity-20 dark:opacity-10 delay-500",
          mode === 'clinical' ? "bg-blue-200" : mode === 'lab' ? "bg-teal-200" : "bg-orange-200"
        )} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/10 blur-[120px] rounded-full animate-pulse-soft" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* UNIFIED STICKY HEADER STACK */}
        <div className="sticky top-0 z-[100] w-full shadow-sm">
          <UpcomingMarquee />
          {activeSession && (
            <SessionTimer 
              sessionId={activeSession.id}
              appointmentDate={activeSession.date}
              status={activeSession.status}
              clientName={activeSession.clientName}
            />
          )}
          <SpaceHeader />
        </div>
        
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