"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Calendar, Target, Upload, HelpCircle, Sparkles, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import { useNavigate } from "react-router-dom";
import HelpModal from "./HelpModal";
import { cn } from "@/lib/utils";

const QuickActions = () => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setClientDialogOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setAppointmentDialogOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        navigate('/procedures');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
        e.preventDefault();
        navigate('/quick-calibrate');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setHelpOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 print:hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className={cn(
                    "h-16 w-16 rounded-[1.5rem] shadow-2xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-500",
                    isOpen ? "rotate-45 scale-110" : "hover:scale-110 hover:rotate-90"
                  )}
                >
                  <Plus size={32} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-3 rounded-[1.5rem] shadow-2xl border-none mb-4">
                <div className="px-2 py-1 mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Quick Actions</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => { navigate("/quick-calibrate"); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                    <Zap size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">Quick Calibrate</span>
                    <span className="text-[10px] text-slate-400">Instant Pathway Logic</span>
                  </div>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘Q
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem 
                  onClick={() => { setClientDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                    <UserPlus size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">New Client</span>
                    <span className="text-[10px] text-slate-400">Add to database</span>
                  </div>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘N
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => { setAppointmentDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mr-3 group-hover:bg-rose-100 transition-colors">
                    <Calendar size={20} className="text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">Book Session</span>
                    <span className="text-[10px] text-slate-400">Schedule appointment</span>
                  </div>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘B
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem 
                  onClick={() => { navigate("/procedures"); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mr-3 group-hover:bg-emerald-100 transition-colors">
                    <Target size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">Procedures</span>
                    <span className="text-[10px] text-slate-400">Track progress</span>
                  </div>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘P
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => { navigate("/import"); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer"
                >
                  <Upload size={20} className="mr-3 text-slate-500" />
                  <span className="font-bold">Import Data</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem 
                  onClick={() => { setHelpOpen(true); setIsOpen(false); }} 
                  className="rounded-xl py-3 px-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                    <HelpCircle size={20} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold block">Help & Shortcuts</span>
                    <span className="text-[10px] text-slate-400">View all commands</span>
                  </div>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘/
                  </kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-bold text-xs">
            <p>Quick Actions Menu</p>
            <p className="text-[10px] text-slate-400 mt-1">Click to open</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={() => {
              setClientDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            onSuccess={() => {
              setAppointmentDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default QuickActions;