"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Brain, Calendar, User, Loader2, RotateCcw, Printer } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";

// Docs Components
import DocsHeader from "@/components/docs/DocsHeader";
import DocsToolbar from "@/components/docs/DocsToolbar";
import DocsRuler from "@/components/docs/DocsRuler";
import DocsOutline from "@/components/docs/DocsOutline";

export default function CranialNerveAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, loading } = useAppointment(id);

  const outlineItems = CRANIAL_NERVES.map(n => ({
    id: `nerve-section-${n.id}`,
    label: `${n.name}: ${n.latinName}`
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FBFD] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Clinical Document...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Appointment not found</h1>
        <Button onClick={() => navigate("/appointments")} className="mt-4">
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-[#F9FBFD] flex flex-col">
      <DocsHeader />
      <DocsToolbar />
      <DocsRuler />

      <div className="flex-1 overflow-auto p-0 md:p-12 flex justify-center print:p-0 print:bg-white">
        {/* Outline Sidebar */}
        <DocsOutline items={outlineItems} />

        {/* Document Container */}
        <div className="w-full max-w-[1000px] bg-white border-none md:border md:border-slate-200 md:shadow-sm p-6 sm:p-10 md:p-20 min-h-[1056px] print:border-none print:p-0 text-black font-sans relative">
          
          {/* Document Header */}
          <header className="mb-16 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <Brain size={28} />
              </div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">Cranial Nerve Assessment</h1>
            </div>
            
            <div className="mt-10 grid grid-cols-2 gap-8 text-xs font-bold border-y border-black py-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase tracking-widest">Client:</span>
                <span className="text-lg font-black">{appointment.clients.name}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-slate-500 uppercase tracking-widest">Date:</span>
                <span className="text-lg font-black">{format(appointment.date, "MMMM do, yyyy")}</span>
              </div>
            </div>
          </header>

          {/* Assessment Content */}
          <div className="space-y-12">
            <CranialNerveAssessment appointmentId={id!} />
          </div>

          {/* Footer Notes */}
          <div className="mt-20 pt-8 border-t border-black">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Clinical Summary & Integration</h3>
            <div className="relative">
              <textarea 
                className="w-full min-h-[200px] bg-transparent border-none outline-none resize-none text-sm leading-[32px] font-medium"
                style={{
                  backgroundImage: 'linear-gradient(to bottom, transparent 31px, #e5e7eb 31px)',
                  backgroundSize: '100% 32px',
                  backgroundAttachment: 'local'
                }}
                placeholder="Type your clinical summary here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 print:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-12 w-12 rounded-full shadow-xl bg-white border-slate-200 text-slate-500 hover:text-indigo-600"
        >
          <ChevronLeft size={20} />
        </Button>
        <Button 
          onClick={() => window.print()} 
          className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer size={24} />
        </Button>
      </div>
    </div>
  );
}