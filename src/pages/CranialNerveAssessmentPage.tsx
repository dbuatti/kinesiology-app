"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppointment } from "@/hooks/useAppointment";
import { CranialNerveAssessment } from "@/components/crm/CranialNerveAssessment";
import { PrimitiveReflexAssessment } from "@/components/crm/PrimitiveReflexAssessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Brain, Calendar, User, Loader2, RotateCcw, Printer, Zap, FileText } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRIMITIVE_REFLEXES } from "@/data/primitive-reflex-data";

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
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navigation - Tabs only as per image */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-slate-100/50 p-1.5 text-muted-foreground">
              <TabsTrigger 
                value="cranial-nerves" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                Cranial Nerves
              </TabsTrigger>
              <TabsTrigger 
                value="primitive-reflexes" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Primitive Reflexes
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <CranialNerveAssessment appointmentId={id!} />
          </TabsContent>
          
          <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <PrimitiveReflexAssessment appointmentId={id!} />
          </TabsContent>
        </Tabs>

        {/* Summary Section */}
        <div className="mt-20 pt-12 border-t border-slate-200 print:mt-10">
          <div className="flex items-center gap-3 mb-6">
            <FileText size={20} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Clinical Summary & Integration</h3>
          </div>
          <textarea 
            className="w-full min-h-[200px] bg-transparent border-none outline-none resize-none text-sm leading-[32px] font-medium placeholder:text-slate-300"
            style={{
              backgroundImage: 'linear-gradient(to bottom, transparent 31px, #e5e7eb 31px)',
              backgroundSize: '100% 32px',
              backgroundAttachment: 'local'
            }}
            placeholder="Type your clinical summary here..."
          />
        </div>
      </div>

      {/* Floating Back Button */}
      <div className="fixed bottom-8 left-8 print:hidden">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/appointments/${id}`)}
          className="h-12 w-12 rounded-full shadow-xl bg-white border-slate-200 text-slate-500 hover:text-indigo-600"
        >
          <ChevronLeft size={20} />
        </Button>
      </div>
    </div>
  );
}