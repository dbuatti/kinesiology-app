"use client";

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Activity, 
  Zap, 
  BookOpen, 
  Plus, 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff,
  HelpCircle,
  UserPlus,
  CalendarPlus,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppMode, AppMode } from "@/components/ModeProvider";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CLINICAL_NAV_ITEMS, LAB_NAV_ITEMS, LIBRARY_NAV_ITEMS } from "@/config/navigation";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import SearchBar from "./SearchBar";
import HubSwitcher from "./HubSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import HelpModal from "./HelpModal";

const SpaceHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useAppMode();
  const { isPrivate, togglePrivacy } = usePrivacyMode();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appDialogOpen, setAppDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = mode === 'clinical' ? CLINICAL_NAV_ITEMS : 
                   mode === 'lab' ? LAB_NAV_ITEMS : 
                   LIBRARY_NAV_ITEMS;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showSuccess("Signed out successfully");
    navigate('/login');
  };

  const getModeIcon = (m: AppMode) => {
    if (m === 'clinical') return <Activity size={16} />;
    if (m === 'lab') return <Zap size={16} />;
    return <BookOpen size={16} />;
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-background border-b border-border px-4 md:px-8 h-16 flex items-center justify-between">
      {/* LEFT: LOGO & HUB SWITCHER */}
      <div className="flex items-center gap-4">
        <Link to="/?view=hub" className="flex items-center">
          <span className="font-black text-lg tracking-tighter text-primary">CLINICAL HUB</span>
        </Link>

        <div className="h-8 w-px bg-border hidden md:block" />

        <HubSwitcher />
      </div>

      {/* CENTER: CONTEXTUAL NAV */}
      <nav className="hidden xl:flex items-center gap-0 border border-border">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-r border-border last:border-r-0 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon size={14} />
              <span className="text-[10px] font-medium uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* RIGHT: ACTIONS & PROFILE */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:block w-48">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          {mode === 'clinical' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 border border-border bg-background">
                <DropdownMenuItem onClick={() => setClientDialogOpen(true)} className="py-3 px-4 cursor-pointer gap-3 focus:bg-muted">
                  <UserPlus size={16} className="text-primary" />
                  <span className="font-medium text-xs uppercase tracking-widest">New Client</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppDialogOpen(true)} className="py-3 px-4 cursor-pointer gap-3 focus:bg-muted">
                  <CalendarPlus size={16} className="text-primary" />
                  <span className="font-medium text-xs uppercase tracking-widest">Book Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10 text-muted-foreground hover:text-foreground">
                <Settings size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-0 border border-border bg-background">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Active Workspace</p>
                <div className="flex items-center gap-3 p-2 bg-muted">
                  {getModeIcon(mode)}
                  <span className="font-medium text-[10px] uppercase tracking-widest">{mode}</span>
                </div>
              </div>
              
              <DropdownMenuItem onClick={togglePrivacy} className="py-3 px-4 cursor-pointer gap-3 focus:bg-muted">
                {isPrivate ? <EyeOff size={16} className="text-destructive" /> : <Eye size={16} />}
                <span className="font-medium text-xs uppercase tracking-widest">{isPrivate ? "Disable Privacy" : "Enable Privacy"}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setHelpOpen(true)} className="py-3 px-4 cursor-pointer gap-3 focus:bg-muted">
                <HelpCircle size={16} />
                <span className="font-medium text-xs uppercase tracking-widest">Help & Shortcuts</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />
              
              <DropdownMenuItem asChild className="py-3 px-4 cursor-pointer gap-3 focus:bg-muted">
                <Link to="/settings">
                  <Settings size={16} />
                  <span className="font-medium text-xs uppercase tracking-widest">System Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleSignOut} className="py-3 px-4 cursor-pointer gap-3 text-destructive focus:bg-destructive/10">
                <LogOut size={16} />
                <span className="font-medium text-xs uppercase tracking-widest">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden w-10 h-10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-[90] bg-background md:hidden">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest px-2">Navigation</p>
              <div className="grid grid-cols-1 gap-0 border border-border">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted"
                  >
                    <item.icon size={18} className="text-primary" />
                    <span className="font-medium text-sm uppercase tracking-widest">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest px-2">Switch Workspace</p>
              <div className="grid grid-cols-3 gap-0 border border-border">
                {(['clinical', 'lab', 'library'] as AppMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setMobileMenuOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 border-r border-border last:border-r-0 transition-colors",
                      mode === m 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {getModeIcon(m)}
                    <span className="text-[8px] font-medium uppercase tracking-widest mt-2">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-8 border border-border">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-medium tracking-tight uppercase">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setClientDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-8 border border-border">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-medium tracking-tight uppercase">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => setAppDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </header>
  );
};

export default SpaceHeader;