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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/appointments/${id}`)}
              className="rounded-xl"
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Neurological Assessment</h1>
              <div className="flex items-center gap-4 mt-1 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><User size={14} className="text-indigo-500" /> {appointment.clients.name}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> {format(appointment.date, "MMMM do, yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-widest border-border bg-card"
            >
              <Printer size={16} className="mr-2" /> Print
            </Button>
            <Button
              onClick={() => navigate(`/appointments/${id}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
            >
              Finish Assessment
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 h-12 p-1 bg-muted/50 rounded-xl mx-auto">
            <TabsTrigger value="cranial-nerves" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Brain className="h-3.5 w-3.5 mr-2" />
              Cranial Nerves
            </TabsTrigger>
            <TabsTrigger value="primitive-reflexes" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Zap className="h-3.5 w-3.5 mr-2" />
              Primitive Reflexes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cranial-nerves" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <div className="bg-card border border-border rounded-[2rem] p-6 md:p-10 shadow-sm">
              <CranialNerveAssessment appointmentId={id!} />
            </div>
          </TabsContent>
          
          <TabsContent value="primitive-reflexes" className="mt-0 focus-visible:ring-0 animate-in fade-in duration-500">
            <div className="bg-card border border-border rounded-[2rem] p-6 md:p-10 shadow-sm">
              <PrimitiveReflexAssessment appointmentId={id!} />
            </div>
          </TabsContent>
        </Tabs>

        <Card className="border-none shadow-lg rounded-[2rem] bg-slate-900 text-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <FileText size={16} /> Clinical Summary & Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <textarea
              className="w-full min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-medium focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-slate-200"
              placeholder="Type your clinical summary here..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}