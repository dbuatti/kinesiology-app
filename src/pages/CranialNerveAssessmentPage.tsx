"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Brain, Calendar, User, Loader2, RotateCcw, Printer, Zap } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";

// Docs Components

import DocsHeader from "@/components/docs/DocsHeader";
import DocsToolbar from "@/components/docs/DocsToolbar";
import DocsRuler from "@/components/docs/DocsRuler";
import DocsOutline from "@/components/docs/DocsOutline";

export default function CranialNerveAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, loading } = useAppointment(id);
  const [activeTab, setActiveTab] = React.useState("cranial-nerves");

  const outlineItems = activeTab === "cranial-nerves"
    ? CRANIAL_NERVES.map(n => ({
        id: `nerve-section-${n.id}`,
        label: `${n.name}: ${n.latinName}`
      }))
    : PRIMITIVE_REFLEXES.map(r => ({
        id: `reflex-section-${r.id}`,
        label: r.name
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
              <h1 className="text-4xl font-serif font-bold tracking-tight">Neurological Assessment</h1>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-12 h-12 p-1 bg-slate-100 rounded-xl mx-auto print:hidden">

                <TabsTrigger value="cranial-nerves" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Brain className="h-3.5 w-3.5 mr-2" />
                  Cranial Nerves
                </TabsTrigger>
                <TabsTrigger value="primitive-reflexes" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Zap className="h-3.5 w-3.5 mr-2" />
                  Primitive Reflexes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0">
                <CranialNerveAssessment appointmentId={id!} />
              </TabsContent>
              
              <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0">
                <PrimitiveReflexAssessment appointmentId={id!} />
              </TabsContent>
            </Tabs>
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