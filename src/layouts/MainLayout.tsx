"use client";

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/crm/Sidebar';
import MobileNav from '@/components/crm/MobileNav';
import QuickActions from '@/components/crm/QuickActions';
import AppFooter from '@/components/crm/AppFooter';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      
      <main className="flex-1 flex flex-col overflow-auto relative">
        {!isSidebarVisible && (
          <div className="hidden lg:block fixed top-6 left-6 z-50">
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
    </div>
  );
};

export default MainLayout;