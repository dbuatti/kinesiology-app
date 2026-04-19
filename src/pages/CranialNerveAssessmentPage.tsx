"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Brain, Loader2, Zap, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CranialNerveAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointment, loading } = useAppointment(id);
  const [activeTab, setActiveTab] = React.useState("cranial-nerves");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Assessment...</p>
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
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Top Navigation - Centered and Compact */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-100/50 p-1 text-muted-foreground">
              <TabsTrigger 
                value="cranial-nerves" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Brain className="h-3.5 w-3.5 mr-2" />
                Cranial Nerves
              </TabsTrigger>
              <TabsTrigger 
                value="primitive-reflexes" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 mr-2" />
                Primitive Reflexes
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <CranialNerveAssessment appointmentId={id!} />
          </TabsContent>
          
          <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-300">
            <PrimitiveReflexAssessment appointmentId={id!} />
          </TabsContent>
        </Tabs>

        {/* Summary Section - Compact */}
        <div className="mt-12 pt-8 border-t border-slate-100 print:mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-slate-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Clinical Summary & Integration</h3>
          </div>
          <textarea 
            className="w-full min-h-[150px] bg-transparent border-none outline-none resize-none text-sm leading-[28px] font-medium placeholder:text-slate-300"
            style={{
              backgroundImage: 'linear-gradient(to bottom, transparent 27px, #f1f5f9 27px)',
              backgroundSize: '100% 28px',
              backgroundAttachment: 'local'
            }}
            placeholder="Type your clinical summary here..."
          />
        </div>
      </div>

      {/* Floating Back Button */}
      <div className="fixed bottom-6 left-6 print:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-10 w-10 rounded-full shadow-lg bg-white border-slate-200 text-slate-400 hover:text-indigo-600"
        >
          <ChevronLeft size={18} />
        </Button>
      </div>
    </div>
  );
}