"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Activity, 
  Zap, 
  BookOpen, 
  Settings, 
  Eye, 
  EyeOff,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode } from "@/components/ModeProvider";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CLINICAL_NAV_ITEMS, LAB_NAV_ITEMS, LIBRARY_NAV_ITEMS } from "@/config/navigation";
import HubSwitcher from "./HubSwitcher";
import SearchBar from "./SearchBar";

const SpaceHeader = () => {
  const location = useLocation();
  const { mode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();

  const navItems = mode === 'clinical' ? CLINICAL_NAV_ITEMS : 
                   mode === 'lab' ? LAB_NAV_ITEMS : 
                   LIBRARY_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-[100] w-full bg-background border-b border-border px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center group">
          <span className="font-serif font-black text-xl tracking-tighter text-primary group-hover:text-foreground transition-colors">Antigravity</span>
        </Link>

        <div className="h-6 w-px bg-border" />

        <HubSwitcher />
      </div>

      <nav className="hidden lg:flex items-center h-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center h-14 px-4 transition-all relative group",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <div className="w-40">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={togglePrivacy}
            className={cn("h-9 w-9 rounded-none", isPrivate ? "text-destructive" : "text-slate-400")}
          >
            {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none text-slate-400 hover:text-primary">
                <Settings size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 rounded-none border-2 border-slate-900 shadow-xl">
              <DropdownMenuItem asChild className="py-2 px-3 cursor-pointer">
                <Link to="/settings" className="flex items-center gap-3">
                  <Settings size={14} />
                  <span className="text-[11px] font-black uppercase tracking-widest">System Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default SpaceHeader;