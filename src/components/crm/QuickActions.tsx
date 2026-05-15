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
import { Plus, UserPlus, Calendar, Target, Upload, HelpCircle, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <div className="fixed bottom-8 right-8 z-50 print:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className={cn(
                "h-16 w-16 bg-primary text-primary-foreground transition-transform duration-300",
                isOpen ? "rotate-45" : ""
              )}
            >
              <Plus size={32} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-0 border border-border bg-background mb-4">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Quick Actions</p>
            </div>
            
            <DropdownMenuItem 
              onClick={() => { navigate("/practice/calibrate"); setIsOpen(false); }} 
              className="p-4 cursor-pointer border-b border-border focus:bg-muted"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mr-4 text-primary">
                <Zap size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">Quick Calibrate</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Instant Pathway Logic</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => { setClientDialogOpen(true); setIsOpen(false); }} 
              className="p-4 cursor-pointer border-b border-border focus:bg-muted"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mr-4 text-primary">
                <UserPlus size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">New Client</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Add to database</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => { setAppointmentDialogOpen(true); setIsOpen(false); }} 
              className="p-4 cursor-pointer border-b border-border focus:bg-muted"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mr-4 text-primary">
                <Calendar size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">Book Session</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Schedule appointment</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => { navigate("/practice/procedures"); setIsOpen(false); }} 
              className="p-4 cursor-pointer border-b border-border focus:bg-muted"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mr-4 text-primary">
                <Target size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">Procedures</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Track progress</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => { setHelpOpen(true); setIsOpen(false); }} 
              className="p-4 cursor-pointer focus:bg-muted"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center mr-4 text-primary">
                <HelpCircle size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-tight">Help & Shortcuts</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">View all commands</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-8 border border-border">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-medium uppercase tracking-tight">Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm onSuccess={() => setClientDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-8 border border-border">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-medium uppercase tracking-tight">Schedule New Session</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => setAppointmentDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export default QuickActions;