"use client";

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/crm/Sidebar';
import MobileNav from '@/components/crm/MobileNav';
import QuickActions from '@/components/crm/QuickActions';
import AppFooter from '@/components/crm/AppFooter';
import BackToTop from '@/components/shared/BackToTop';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen } from 'lucide-react';

const MainLayout = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const saved = localStorage.getItem("antigravity_sidebar_visible");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  useEffect(() => {
    localStorage.setItem("antigravity_sidebar_visible", JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <MobileNav />
      {isSidebarVisible && <Sidebar onHide={() => setIsSidebarVisible(false)} />}
      
      <main id="main-scroll-container" className="flex-1 flex flex-col overflow-auto relative">
        {!isSidebarVisible && (
          <div className="hidden lg:block fixed top-6 left-6 z-[60]">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsSidebarVisible(true)}
              className="h-12 w-12 rounded-2xl bg-card border-border shadow-xl hover:bg-accent hover:text-indigo-600 transition-all group"
            >
              <PanelLeftOpen size={24} className="group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        )}
        
        <div className="flex-1 p-0">
          <Outlet />
        </div>
        
        <AppFooter />
      </main>
      <QuickActions />
      <BackToTop />
    </div>
  );
};

export default MainLayout;