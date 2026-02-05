"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, Heart, Dumbbell } from 'lucide-react';

interface SessionNavBarProps {
  appointmentId: string;
  activeTab: 'phases' | 'kinesiology' | 'muscles';
  onTabChange: (tab: 'phases' | 'kinesiology' | 'muscles') => void;
}

const SessionNavBar = ({ appointmentId, activeTab, onTabChange }: SessionNavBarProps) => {
  const navItems = [
    { 
      id: 'phases', 
      label: '5 Phases', 
      icon: Home, 
      path: `/appointments/${appointmentId}`,
      description: "The 5-step session workflow"
    },
    { 
      id: 'kinesiology', 
      label: 'Kinesiology Tools', 
      icon: Heart, 
      path: `/appointments/${appointmentId}?tab=kinesiology`,
      description: "Emotional & Energetic Assessments"
    },
    { 
      id: 'muscles', 
      label: 'Muscles', 
      icon: Dumbbell, 
      path: `/appointments/${appointmentId}?tab=muscles`,
      description: "Muscle Testing Log"
    },
  ] as const;

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Home/Dashboard Link */}
        <Link to="/" className="flex items-center gap-2 text-slate-900 hover:text-indigo-600 transition-colors">
          <Home size={20} />
          <span className="hidden sm:inline font-semibold">Dashboard</span>
        </Link>

        {/* Center: Session Navigation */}
        <nav className="flex space-x-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onTabChange(item.id as 'phases' | 'kinesiology' | 'muscles')}
                className={cn(
                  "h-10 px-4 rounded-xl font-semibold transition-all",
                  isActive 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon size={18} className="mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Right: Placeholder/Actions (Can be expanded later) */}
        <div className="w-20">
          {/* Placeholder for future actions */}
        </div>
      </div>
    </div>
  );
};

export default SessionNavBar;