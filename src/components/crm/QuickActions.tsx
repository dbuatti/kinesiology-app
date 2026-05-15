"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, UserPlus, Calendar, CalendarPlus, Target, Upload, HelpCircle, Zap, StickyNote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  return (
    <>
      <div className="fixed bottom-10 right-10 z-50 print:hidden flex flex-col items-end gap-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <span className={cn(
                    "bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-3xl transition-all duration-700",
                    isOpen ? "opacity-0 translate-x-6" : "opacity-100 translate-x-0"
                  )}>
                    Quick Actions
                  </span>
                  <Button
                    size="lg"
                    className={cn(
                      "h-16 w-16 md:h-20 md:w-20 rounded-[2rem] md:rounded-[2.5rem] shadow-3xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-700",
                      isOpen ? "rotate-45 scale-110" : "hover:scale-110 hover:rotate-90"
                    )}
                  >
                    <Plus size={36} strokeWidth={3} />
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4 rounded-[2.5rem] shadow-3xl border-none mb-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="px-3 py-2 mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Clinical Command</p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/calibrate"); setIsOpen(false); }} 
                  className="rounded-2xl py-5 px-6 cursor-pointer group transition-all hover:bg-amber-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mr-5 group-hover:bg-amber-100 transition-colors shadow-inner">
                    <Zap size={24} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-base block text-slate-900">Quick Calibrate</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant Pathway Logic</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘Q
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { setClientDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-5 px-6 cursor-pointer group transition-all hover:bg-indigo-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mr-5 group-hover:bg-indigo-100 transition-colors shadow-inner">
                    <UserPlus size={24} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-base block text-slate-900">New Client</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add to database</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘N
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => { setAppointmentDialogOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-5 px-6 cursor-pointer group transition-all hover:bg-rose-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mr-5 group-hover:bg-rose-100 transition-colors shadow-inner">
                    <Calendar size={24} className="text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-base block text-slate-900">Book Session</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule appointment</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘B
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { navigate("/practice/procedures"); setIsOpen(false); }} 
                  className="rounded-2xl py-5 px-6 cursor-pointer group transition-all hover:bg-emerald-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mr-5 group-hover:bg-emerald-100 transition-colors shadow-inner">
                    <Target size={24} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-base block text-slate-900">Procedures</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Track progress</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘P
                  </kbd>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-3 bg-slate-100" />

                <DropdownMenuItem 
                  onClick={() => { setHelpOpen(true); setIsOpen(false); }} 
                  className="rounded-2xl py-5 px-6 cursor-pointer group transition-all hover:bg-slate-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mr-5 group-hover:bg-slate-100 transition-colors shadow-inner">
                    <HelpCircle size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-base block text-slate-900">Help & Shortcuts</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View all commands</span>
                  </div>
                  <kbd className="hidden md:inline-flex ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘/
                  </kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-bold text-xs p-3 shadow-2xl border-none bg-slate-900 text-white">
            <p>Quick Actions Menu</p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Click to open</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl">
                  <UserPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Add New Client</DialogTitle>
                  <DialogDescription className="text-base font-medium">Create a new client profile in your clinical database.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <ClientForm
              onSuccess={() => {
                setClientDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-0 border-none shadow-3xl">
          <div className="p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xl">
                  <CalendarPlus size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Schedule Session</DialogTitle>
                  <DialogDescription className="text-base font-medium">Select a client and set the appointment details.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <AppointmentForm
              onSuccess={() => {
                setAppointmentDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default QuickActions;