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
import { Plus, UserPlus, Calendar, Target, Upload, Keyboard, HelpCircle } from "lucide-react";
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

const QuickActions = () => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N for new client
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setClientDialogOpen(true);
      }
      // Cmd/Ctrl + B for book appointment
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setAppointmentDialogOpen(true);
      }
      // Cmd/Ctrl + P for procedures
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        navigate('/procedures');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-[1.5rem] shadow-2xl bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-110 hover:rotate-90 duration-500"
                >
                  <Plus size={32} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2 rounded-[1.5rem] shadow-2xl border-none mb-4">
                <DropdownMenuItem onClick={() => setClientDialogOpen(true)} className="rounded-xl py-3 px-4 cursor-pointer">
                  <UserPlus size={20} className="mr-3 text-indigo-500" />
                  <span className="flex-1 font-bold">New Client</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘N
                  </kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAppointmentDialogOpen(true)} className="rounded-xl py-3 px-4 cursor-pointer">
                  <Calendar size={20} className="mr-3 text-rose-500" />
                  <span className="flex-1 font-bold">Book Session</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘B
                  </kbd>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={() => navigate("/procedures")} className="rounded-xl py-3 px-4 cursor-pointer">
                  <Target size={20} className="mr-3 text-emerald-500" />
                  <span className="flex-1 font-bold">Procedures</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘P
                  </kbd>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/import")} className="rounded-xl py-3 px-4 cursor-pointer">
                  <Upload size={20} className="mr-3 text-slate-500" />
                  <span className="font-bold">Import Data</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={() => setHelpOpen(true)} className="rounded-xl py-3 px-4 cursor-pointer">
                  <HelpCircle size={20} className="mr-3 text-amber-500" />
                  <span className="flex-1 font-bold">Help & Shortcuts</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-black text-slate-600">
                    ⌘/
                  </kbd>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="left" className="rounded-xl font-bold text-xs">
            <p>Quick Actions</p>
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