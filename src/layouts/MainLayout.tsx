"use client";

import React from 'react';
import { Outlet } from 'react-router-dom';
import SpaceHeader from '@/components/crm/SpaceHeader';
import QuickActions from '@/components/crm/QuickActions';
import AppFooter from '@/components/crm/AppFooter';
import BackToTop from '@/components/shared/BackToTop';
import UpcomingMarquee from '@/components/crm/UpcomingMarquee';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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