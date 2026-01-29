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
import { Plus, UserPlus, Calendar, Target, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ClientForm from "./ClientForm";
import AppointmentForm from "./AppointmentForm";
import { useNavigate } from "react-router-dom";

const QuickActions = () => {
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-110"
            >
              <Plus size={24} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setClientDialogOpen(true)}>
              <UserPlus size={18} className="mr-2" />
              New Client
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAppointmentDialogOpen(true)}>
              <Calendar size={18} className="mr-2" />
              Book Appointment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/procedures")}>
              <Target size={18} className="mr-2" />
              View Procedures
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/import")}>
              <Upload size={18} className="mr-2" />
              Import Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={() => {
              setClientDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            onSuccess={() => {
              setAppointmentDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActions;