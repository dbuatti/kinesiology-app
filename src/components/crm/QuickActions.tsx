"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Calendar, Zap, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const QuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 bg-slate-900 text-white rounded-none shadow-2xl transition-all duration-300 hover:scale-110",
              isOpen ? "rotate-45 bg-primary" : ""
            )}
          >
            <Plus size={28} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-0 border-2 border-slate-900 bg-background mb-4 rounded-none shadow-2xl">
          <div className="px-4 py-3 border-b border-border bg-slate-50">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary">Quick Actions</p>
          </div>
          
          {[
            { label: "Quick Calibrate", sub: "Instant Logic", icon: Zap, path: "/practice/calibrate" },
            { label: "New Client", sub: "Add to database", icon: UserPlus, path: "/clients" },
            { label: "Book Session", sub: "Schedule", icon: Calendar, path: "/schedule" },
            { label: "Help", sub: "Shortcuts", icon: HelpCircle, path: "#" },
          ].map((item, i) => (
            <DropdownMenuItem 
              key={i}
              onClick={() => { if (item.path !== "#") navigate(item.path); setIsOpen(false); }} 
              className="p-4 cursor-pointer border-b border-border last:border-b-0 focus:bg-muted rounded-none"
            >
              <div className="w-8 h-8 border border-border flex items-center justify-center mr-4 text-primary">
                <item.icon size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-tight">{item.label}</span>
                <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{item.sub}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default QuickActions;