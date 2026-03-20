"use client";

import React, { useState, useEffect } from 'react';
import { Target, Sparkles, X, Trophy } from 'lucide-react';
import { getWeeklyFocus } from '@/utils/weekly-focus';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const WeeklyFocusBanner = () => {
  const [items, setItems] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const loadFocus = async () => {
    try {
      const focusItems = await getWeeklyFocus();
      setItems(focusItems);
      setIsVisible(focusItems.length > 0);
    } catch (e) {
      console.error("Failed to load weekly focus banner", e);
    }
  };

  useEffect(() => {
    loadFocus();

    // Listen for changes to the weekly_focus table
    const channel = supabase
      .channel('weekly-focus-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_focus' }, loadFocus)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isVisible || items.length === 0) return null;

  return (
    <div className="w-full mb-6 animate-in slide-in-from-top-4 duration-700">
      <div className="bg-indigo-600 text-white rounded-[2rem] p-4 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 border-2 border-indigo-400/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Trophy size={60} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Target size={20} className="text-indigo-100" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-200">Weekly Mastery Focus</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {items.map((item, i) => (
                  <React.Fragment key={item}>
                    <span className="text-sm font-black tracking-tight">{item}</span>
                    {i < items.length - 1 && <span className="text-indigo-400 opacity-50">•</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
              <Sparkles size={12} className="text-amber-300" />
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100">Clinical Priority</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyFocusBanner;