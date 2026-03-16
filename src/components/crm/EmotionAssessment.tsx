"use client";

import React, { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Heart, Zap, List, Layers, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditableField from "@/components/shared/EditableField";
import { CHANNEL_EMOTIONS, ELEMENT_EMOTIONS } from "@/data/emotion-data";
import { showSuccess, showError } from "@/utils/toast";

interface EmotionAssessmentProps {
  appointmentId: string;
  initialMode: string | null | undefined;
  initialPrimary: string | null | undefined;
  initialSecondary: string[] | null | undefined; // Updated type
  initialNotes: string | null | undefined;
  onSaveField: (field: string, value: string | string[] | null) => Promise<void>; // Updated signature
  onUpdate: () => void;
}

const EmotionAssessment = ({ 
  initialMode, 
  initialPrimary, 
  initialSecondary, 
  initialNotes, 
  onSaveField,
  onUpdate
}: EmotionAssessmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<string>(initialMode || 'channel');
  const [primarySelection, setPrimarySelection] = useState<string>(initialPrimary || '');
  const [secondarySelections, setSecondarySelections] = useState<string[]>(initialSecondary || []); // Updated state
  const [isSaving, setIsSaving] = useState(false);

  // Sync internal state when external props change (e.g., from real-time update)
  useEffect(() => {
    setMode(initialMode || 'channel');
    setPrimarySelection(initialPrimary || '');
    setSecondarySelections(initialSecondary || []);
  }, [initialMode, initialPrimary, initialSecondary]);

  const currentData = mode === 'channel' ? CHANNEL_EMOTIONS : ELEMENT_EMOTIONS;
  const primaryKeys = Object.keys(currentData);
  
  // Ensure secondaryOptions defaults to an empty array if primarySelection is invalid or missing
  const secondaryOptions = primarySelection ? currentData[primarySelection] || [] : [];

  const handleSave = async (newMode: string, newPrimary: string, newSecondaries: string[]) => {
    setIsSaving(true);
    try {
      await Promise.all([
        onSaveField('emotion_mode', newMode),
        onSaveField('emotion_primary_selection', newPrimary || null),
        onSaveField('emotion_secondary_selection', newSecondaries.length > 0 ? newSecondaries : null),
      ]);
    } catch (error) {
      console.error("Failed to save emotion assessment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setPrimarySelection('');
    setSecondarySelections([]);
    handleSave(newMode, '', []);
  };

  const handlePrimarySelect = (selection: string) => {
    setPrimarySelection(selection);
    setSecondarySelections([]);
    handleSave(mode, selection, []);
  };

  const handleSecondaryToggle = (emotion: string) => {
    const newSelections = secondarySelections.includes(emotion)
      ? secondarySelections.filter(s => s !== emotion)
      : [...secondarySelections, emotion];
      
    setSecondarySelections(newSelections);
    handleSave(mode, primarySelection, newSelections);
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset the Emotional Assessment data for this session?")) return;
    
    setIsSaving(true);
    try {
      // 1. Clear database fields to null
      await Promise.all([
        onSaveField('emotion_mode', null),
        onSaveField('emotion_primary_selection', null),
        onSaveField('emotion_secondary_selection', null),
        onSaveField('emotion_notes', null),
      ]);
      
      // 2. Reset local state
      setMode('channel');
      setPrimarySelection('');
      setSecondarySelections([]);
      
      showSuccess("Emotional assessment reset successfully.");
      onUpdate();
    } catch (error: any) {
      showError(error.message || "Failed to reset emotional assessment.");
    } finally {
      setIsSaving(false);
    }
  };

  const getPrimaryColor = (key: string) => {
    if (mode === 'element') {
      switch (key) {
        case 'FIRE': return 'bg-red-500 hover:bg-red-600';
        case 'EARTH': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'METAL': return 'bg-gray-500 hover:bg-gray-600';
        case 'WATER': return 'bg-blue-500 hover:bg-blue-600';
        case 'WOOD': return 'bg-green-500 hover:bg-green-700';
        default: return 'bg-slate-500 hover:bg-slate-600';
      }
    }
    return 'bg-indigo-500 hover:bg-indigo-600';
  };

  const isComplete = secondarySelections.length > 0;
  const shouldShowReset = initialMode || initialPrimary || (initialSecondary && initialSecondary.length > 0) || initialNotes;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 cursor-pointer hover:from-red-100 hover:to-pink-100 transition-colors">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                  <Heart size={24} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Emotional Assessment (PS12)</CardTitle>
                  <CardDescription className="text-slate-600">Identify and balance core emotional context</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {shouldShowReset && (
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    disabled={isSaving}
                    className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                  >
                    <RotateCcw size={16} className="mr-1" />
                    Reset
                  </Button>
                )}
                {isComplete && (
                  <Badge className="px-4 py-2 text-sm font-bold shadow-sm bg-emerald-500 text-white hover:bg-emerald-600">
                    Balanced
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className={cn("h-5 w-5 transition-transform text-slate-600", isOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Protocol:</strong> Use PS12 mode (thumb to ring finger pad) to challenge the body for the relevant mode, primary selection (Channel/Element), and secondary selection (Specific Emotion). You can now select <strong>multiple</strong> specific emotions.
              </AlertDescription>
            </Alert>

            {/* Step 1: Mode Selection */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers size={16} className="text-red-600" /> 1. Select Assessment Mode
              </h3>
              <div className="flex gap-3">
                <Button
                  variant={mode === 'channel' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('channel')}
                  className={cn("flex-1 h-10", mode === 'channel' ? "bg-red-600 hover:bg-red-700" : "border-slate-300 hover:bg-white")}
                  disabled={isSaving}
                >
                  By Channel
                </Button>
                <Button
                  variant={mode === 'element' ? 'default' : 'outline'}
                  onClick={() => handleModeChange('element')}
                  className={cn("flex-1 h-10", mode === 'element' ? "bg-red-600 hover:bg-red-700" : "border-slate-300 hover:bg-white")}
                  disabled={isSaving}
                >
                  By 5 Element
                </Button>
              </div>
            </div>

            {/* Step 2: Primary Selection (Channel/Element) */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-white">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <List size={16} className="text-indigo-600" /> 2. Select {mode === 'channel' ? 'Channel/Meridian' : 'Element'}
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-lg">
                {primaryKeys.map((key) => (
                  <Button
                    key={key}
                    variant={primarySelection === key ? 'default' : 'outline'}
                    onClick={() => handlePrimarySelect(key)}
                    className={cn(
                      "h-8 text-xs font-semibold",
                      primarySelection === key 
                        ? getPrimaryColor(key) + " text-white" 
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    )}
                    disabled={isSaving}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>

            {/* Step 3: Secondary Selection (Specific Emotion) */}
            <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-emerald-600" /> 3. Select Specific Emotion/Feeling (Multiple allowed)
              </h3>
              {primarySelection ? (
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-white">
                  {secondaryOptions.map((emotion) => (
                    <Button
                      key={emotion}
                      variant={secondarySelections.includes(emotion) ? 'default' : 'outline'}
                      onClick={() => handleSecondaryToggle(emotion)}
                      className={cn(
                        "h-8 text-xs font-semibold",
                        secondarySelections.includes(emotion)
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                      )}
                      disabled={isSaving}
                    >
                      {emotion}
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-sm text-amber-900">
                    Please select a Channel or Element first in Step 2.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Summary and Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <Card className="border-2 border-red-200 bg-red-50/50 shadow-none rounded-2xl">
                <CardContent className="pt-4 space-y-2">
                  <h4 className="text-sm font-bold text-red-900 uppercase tracking-widest">Current Emotional Focus</h4>
                  <div className="flex flex-wrap gap-2">
                    {secondarySelections.length > 0 ? (
                      secondarySelections.map(emotion => (
                        <Badge key={emotion} className="bg-red-600 hover:bg-red-700 text-white text-base font-extrabold">
                          {emotion}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xl<dyad-problem-report summary="27 problems">
<problem file="src/pages/ClientDetailPage.tsx" line="33" column="25" code="2307">Cannot find module '@/components/shared/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/AppointmentsPage.tsx" line="53" column="25" code="2307">Cannot find module '@/components/shared/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/components/crm/SympatheticDownRegulation.tsx" line="16" column="27" code="2307">Cannot find module '@/components/shared/EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/T1SympatheticReset.tsx" line="16" column="27" code="2307">Cannot find module '@/components/shared/EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/DiaphragmReset.tsx" line="16" column="27" code="2307">Cannot find module '@/components/shared/EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/VagusNerveProcess.tsx" line="29" column="27" code="2307">Cannot find module '@/components/shared/EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/session-tabs/SympatheticTab.tsx" line="8" column="27" code="2307">Cannot find module '@/components/shared/EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/EmotionAssessment.tsx" line="15" column="27" code="2307">Cannot find module './EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/GaitReflexAssessment.tsx" line="7" column="27" code="2307">Cannot find module './EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/SessionContentSwitcher.tsx" line="22" column="27" code="2307">Cannot find module './EditableField' or its corresponding type declarations.</problem>
<problem file="src/components/crm/AppointmentContextCards.tsx" line="9" column="27" code="2307">Cannot find module './EditableField' or its corresponding type declarations.</problem>
<problem file="src/pages/AppointmentDetailPage.tsx" line="16" column="27" code="2307">Cannot find module '@/components/crm/EditableField' or its corresponding type declarations.</problem>
<problem file="src/pages/AppointmentDetailPage.tsx" line="32" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/ProceduresPage.tsx" line="25" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/ResourcesPage.tsx" line="42" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/SelfPracticePage.tsx" line="18" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/ClinicalOversightPage.tsx" line="16" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/DemoSessionPage.tsx" line="15" column="27" code="2307">Cannot find module '@/components/crm/EditableField' or its corresponding type declarations.</problem>
<problem file="src/pages/DemoSessionPage.tsx" line="34" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/NorthStarPage.tsx" line="5" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/pages/QuickCalibratePage.tsx" line="5" column="25" code="2307">Cannot find module '@/components/crm/Breadcrumbs' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="9" column="28" code="2307">Cannot find module './components/shared/PageTransition' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="13" column="24" code="2307">Cannot find module './layouts/MainLayout' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="14" column="24" code="2307">Cannot find module './layouts/AuthLayout' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="17" column="27" code="2307">Cannot find module './pages/app/DashboardPage' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="18" column="23" code="2307">Cannot find module './pages/auth/LoginPage' or its corresponding type declarations.</problem>
<problem file="src/App.tsx" line="19" column="28" code="2307">Cannot find module './pages/public/OnboardingPage' or its corresponding type declarations.</problem>
</dyad-problem-report><think>**Addressing Import Paths**

I'm currently focused on resolving 27 TypeScript errors stemming from import path issues. The `Breadcrumbs` component was relocated from a CRM-specific directory to a shared component location. Also, the `EditableField` component was also moved. These refactors require path corrections throughout the codebase, which I'm working to identify and address systematically.


**Tracking Component Relocations**

I've just finished documenting the movement of several components and pages. I've noted `PageTransition`, `DashboardPage`, `LoginPage`, and `OnboardingPage` relocations. I've also identified the import updates required in files such as `ClientDetailPage.tsx`, `AppointmentsPage.tsx`, and several CRM-specific components that use the `EditableField`.


**Updating Import Declarations**

I'm now methodically updating imports in several CRM-specific components, including `EmotionAssessment`, `GaitReflexAssessment`, `SessionContentSwitcher`, and `AppointmentContextCards`, all referencing the relocated `EditableField`. I'm also addressing import paths within page components. This includes pages like `AppointmentDetailPage`, `ProceduresPage`, `ResourcesPage`, and others that use `Breadcrumbs`, and `App.tsx` requires import path updates to several layout components.


**Refining Import Updates**

I'm currently focused on refining import statements for `LoginPage` and `OnboardingPage`. I've also identified several files requiring immediate attention: `ClientDetailPage.tsx`, `AppointmentsPage.tsx`, and a series of CRM components (`SympatheticDownRegulation.tsx`, `T1SympatheticReset.tsx`, `DiaphragmReset.tsx`, `VagusNerveProcess.tsx`, `SympatheticTab.tsx`, `EmotionAssessment.tsx`, `GaitReflexAssessment.tsx`, `SessionContentSwitcher.tsx`, `AppointmentContextCards.tsx`) that use the relocated `EditableField`. Lastly, `AppointmentDetailPage.tsx` also needs some work.


**Pinpointing Import Locations**

I'm now identifying and listing specific files and the components I need to update. I'm focusing on components like `EditableField` and `Breadcrumbs`, and I've detailed all the relevant import paths for pages like `ProceduresPage`, `ResourcesPage`, `SelfPracticePage`, and more. I'm also carefully noting import updates within `App.tsx` for layout and page components.


**Verifying File Paths**

I'm now investigating "Cannot find module" errors in `App.tsx` related to the `PageTransition`, `MainLayout`, `AuthLayout`, `DashboardPage`, `LoginPage`, and `OnboardingPage` imports. The previous version of `App.tsx` had the same import paths, so I'm checking if the files were correctly written to these relative locations or if there's a problem with file extensions.


**Correcting Import Paths**

I've pinpointed the root cause: incorrect import paths due to recent file renames and relocations. I'm systematically going through affected files. I've corrected import statements in `ClientDetailPage.tsx` and `AppointmentsPage.tsx` to reference the relocated `Breadcrumbs` component from the shared directory. Similarly, I've updated imports in `SympatheticDownRegulation.tsx` for the shared `EditableField`. I'll extend this to the other components.

I've addressed the remaining components:
5.  `src/components/crm/T1SympatheticReset.tsx`: `import EditableField from "@/components/shared/EditableField";`
6.  `src/components/crm/DiaphragmReset.tsx`: `import EditableField from "@/components/shared/EditableField";`
7.  `src/components/crm/VagusNerveProcess.tsx`: `import EditableField from "@/components/shared/EditableField";`
8.  `src/components/crm/SympatheticTab.tsx`: `import EditableField from "@/components/shared/EditableField";`
9.  `src/components/crm/EmotionAssessment.tsx`: `import EditableField from "@/components/shared/EditableField";`
10. `src/components/crm/GaitReflexAssessment.tsx`: `import EditableField from "@/components/shared/EditableField";`
11. `src/components/crm/SessionContentSwitcher.tsx`: `import EditableField from "@/components/shared/EditableField";`
12. `src/components/crm/AppointmentContextCards.tsx`: `import EditableField from "@/components/shared/EditableField";`
13. `src/pages/AppointmentDetailPage.tsx`: `import Breadcrumbs from "@/components/shared/Breadcrumbs";`

All components requiring import updates have been updated.


**Finalizing Import Corrections**

I've just finished the final import path corrections. I updated  `/crm/T1SympatheticReset.tsx`, `/crm/DiaphragmReset.tsx`, `/crm/VagusNerveProcess.tsx`, `/crm/session-tabs/SympatheticTab.tsx`, `/crm/EmotionAssessment.tsx`, and `/crm/GaitReflexAssessment.tsx`, and `/crm/SessionContentSwitcher.tsx`, `/crm/AppointmentContextCards.tsx` and `/pages/AppointmentDetailPage.tsx`, to point to the shared `EditableField`. I also updated `AppointmentDetailPage.tsx` to include `Breadcrumbs`. I believe all import issues are now resolved.


**Updating Remaining Imports**

I'm now in the final stage, methodically updating imports in several remaining files. I've corrected import statements for `ProceduresPage.tsx`, `ResourcesPage.tsx`, `SelfPracticePage.tsx`, `ClinicalOversightPage.tsx`, `DemoSessionPage.tsx`, `NorthStarPage.tsx`, and `QuickCalibratePage.tsx` to reference `Breadcrumbs`, and `DemoSessionPage.tsx` will also use `EditableField`. I'm also addressing the imports in `App.tsx` for layout and page components: `PageTransition`, `MainLayout`, `AuthLayout`, `DashboardPage`. I believe that will be everything.


**Revisiting App.tsx Imports**

I'm now revisiting the import statements for layout and page components within `App.tsx`. I was getting "cannot find module" errors, but now I'm confirming that the file content was properly written to the new locations after the rename. I'm focusing on validating the import paths for `PageTransition`, `MainLayout`, `AuthLayout`, `DashboardPage`, `LoginPage`, and `OnboardingPage`. I will double-check each import path's relativity to the destination component.


</think>I will update the import paths for `Breadcrumbs`, `EditableField`, and `PageTransition` across all affected files to resolve the TypeScript compilation errors caused by the directory refactor.

<dyad-write path="src/pages/ClientDetailPage.tsx" description="Fixing Breadcrumbs import path.">
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getClientRollups } from "@/utils/crm-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, 
  Loader2, Briefcase, Heart, Baby,
  Activity, Edit3, Trash2, MoreHorizontal, FlaskConical, TrendingUp, Clock, Brain,
  LayoutDashboard, History, ArrowRight, Copy, Check, Sparkles, Plus, Link as LinkIcon
} from "lucide-react";
import { format } from "date-fns";
import { Client, Appointment } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppointmentForm from "@/components/crm/AppointmentForm";
import ClientForm from "@/components/crm/ClientForm";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientProgressTab from "@/components/crm/ClientProgressTab";
import ClientProfileCard from "@/components/crm/ClientProfileCard";

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appOpen, setAppOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [aiCopying, setAiCopying] = useState(false);
  const [linkCopying, setLinkCopying] = useState(false);
  const { addRecentClient } = useRecentClients();

  const fetchClientData = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;

      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (appError) throw appError;

      const mappedClient = {
        ...clientData,
        born: clientData.born ? new Date(clientData.born) : null,
        suburbs: clientData.suburbs || []
      } as unknown as Client;

      setClient(mappedClient);
      addRecentClient({ id: mappedClient.id, name: mappedClient.name });

      setAppointments((appData || []).map(a => ({
        ...a,
        date: new Date(a.date)
      })) as unknown as Appointment[]);

    } catch (err) {
      console.error("Error fetching client details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyOnboardingLink = () => {
    if (!client) return;
    setLinkCopying(true);
    const url = `${window.location.origin}/onboarding/${client.id}`;
    navigator.clipboard.writeText(url);
    showSuccess("Onboarding link copied to clipboard!");
    setTimeout(() => setLinkCopying(false), 2000);
  };

  const handleCopyForAI = () => {
    if (!client) return;
    setAiCopying(true);

    const latestApp = appointments[0];
    
    let prompt = `
I am a Kinesiology practitioner analyzing a client case. Please provide clinical insights based on the following data:

CLIENT PROFILE:
- Name: ${client.name}
- History: ${client.journal || 'N/A'}

LATEST SESSION FINDINGS (${latestApp ? format(latestApp.date, "MMM d, yyyy") : 'No sessions'}):
- Goal: ${latestApp?.goal || 'N/A'}
- Primary Issue: ${latestApp?.issue || 'N/A'}
- BOLT Score: ${latestApp?.bolt_score ? \`\${latestApp.bolt_score}s\` : 'N/A'}
- Coherence: ${latestApp?.coherence_score ? latestApp.coherence_score.toFixed(2) : 'N/A'}
- Acupoints Used: ${latestApp?.acupoints || 'N/A'}

Please analyze the relationship between the respiratory (BOLT), autonomic (Coherence), and emotional findings.
`;

    navigator.clipboard.writeText(prompt.trim());
    showSuccess("Case data formatted and copied for AI analysis!");
    setTimeout(() => setAiCopying(false), 2000);
  };

  const handleDeleteClient = async () => {
    if (!confirm("Are you sure you want to delete this client? This will remove all their appointments too.")) return;
    
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Client deleted successfully");
      navigate('/clients');
    } catch (err: any) {
      showError(err.message || "Failed to delete client");
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={48} />
    </div>
  );

  if (!client) return <div className="p-12 text-center">Client not found</div>;

  const rollups = getClientRollups(appointments);

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-6">
      <Breadcrumbs 
        items={[
          { label: "Clients", path: "/clients" },
          { label: client.name }
        ]} 
      />

      <div className="flex items-center justify-between gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-2" /> Back to Clients
          </Button>
        </Link>
        <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold"
              onClick={handleCopyOnboardingLink}
            >
              {linkCopying ? <Check size={16} className="mr-2" /> : <LinkIcon size={16} className="mr-2" />}
              Copy Onboarding Link
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold"
              onClick={handleCopyForAI}
            >
              {aiCopying ? <Check size={16} className="mr-2 text-emerald-500" /> : <Sparkles size={16} className="mr-2" />}
              Copy Case for AI
            </Button>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white rounded-xl border-slate-200">
                  <Edit3 size={16} className="mr-2" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Edit Client Profile</DialogTitle>
                </DialogHeader>
                <ClientForm 
                  initialData={client}
                  onSuccess={() => {
                    setEditOpen(false);
                    fetchClientData();
                  }} 
                />
              </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <MoreHorizontal size={20} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={handleDeleteClient}
                    >
                        <Trash2 size={16} className="mr-2" /> Delete Client
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-200/50 p-1.5 rounded-2xl mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <LayoutDashboard size={14} /> Overview
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <History size={14} /> Appointments
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-xl h-11 font-black uppercase tracking-wider text-[10px]">
            <TrendingUp size={14} /> Progress & Protocols
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <ClientProfileCard client={client} />

              <Card className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold text-slate-900">Contact & Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.occupation && (
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Briefcase size={16} />
                      </div>
                      <span className="text-slate-700">{client.occupation}</span>
                    </div>
                  )}
                  {client.marital_status && (
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Heart size={16} />
                      </div>
                      <span className="text-slate-700">{client.marital_status}</span>
                    </div>
                  )}
                  {client.children && (
                    <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Baby size={16} />
                      </div>
                      <span className="text-slate-700">Children: {client.children}</span>
                    </div>
                  )}
                  <hr className="border-slate-100" />
                  <div className="flex items-center justify-between group/contact p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Mail size={16} />
                      </div>
                      <span className="text-slate-700">{client.email || 'No email'}</span>
                    </div>
                    {client.email && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" onClick={() => handleCopy(client.email, 'email')}>
                        {copiedField === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between group/contact p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Phone size={16} />
                      </div>
                      <span className="text-slate-700">{client.phone || 'No phone'}</span>
                    </div>
                    {client.phone && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/contact:opacity-100 transition-opacity" onClick={() => handleCopy(client.phone, 'phone')}>
                        {copiedField === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <MapPin size={16} />
                    </div>
                    <div className="flex gap-1 flex-wrap text-slate-700">
                      {client.suburbs.length > 0 ? client.suburbs.map(s => <span key={s} className="mr-1">{s}</span>) : 'No suburb'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-indigo-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                      <Activity size={16} className="text-indigo-500" /> Total Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-slate-900">{rollups.totalSessions}</p>
                    <p className="text-xs text-slate-400 mt-1">Last: {rollups.lastAppointment}</p>
                  </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                      <FlaskConical size={16} className="text-emerald-500" /> Latest BOLT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={cn(
                      "text-3xl font-extrabold",
                      appointments.find(a => a.bolt_score)?.bolt_score ? (appointments.find(a => a.bolt_score)!.bolt_score! >= 25 ? "text-emerald-600" : "text-rose-600") : "text-slate-300"
                    )}>
                      {appointments.find(a => a.bolt_score)?.bolt_score ? \`\${appointments.find(a => a.bolt_score)!.bolt_score}s\` : "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Target: 40s</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl bg-white border-t-4 border-rose-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                      <Brain size={16} className="text-rose-500" /> Latest Coherence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-extrabold text-rose-600">
                      {appointments.find(a => a.coherence_score)?.coherence_score?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Autonomic sync ratio</p>
                  </CardContent>
                </Card>
              </div>

              {client.journal && (
                <Card className="bg-amber-50/50 border-amber-100 shadow-none rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                      History & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-900/80 whitespace-pre-wrap leading-relaxed">{client.journal}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between items-center pt-4">
                <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => setSearchParams({ tab: "appointments" })}>
                  View All <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>

              <div className="grid gap-4">
                {appointments.slice(0, 3).map(app => (
                  <Link key={app.id} to={`/appointments/\${app.id}`}>
                    <Card className="hover:shadow-md transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{(app as any).display_id || app.id.slice(0,8)}</Badge>
                              <span className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{app.name || format(app.date, "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> {format(app.date, "MMM d")}</span>
                              <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-bold",
                                  app.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                              )}>
                                {app.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900">Session History</h3>
            <Dialog open={appOpen} onOpenChange={setAppOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 rounded-xl h-10 px-4">
                  <Plus size={16} className="mr-2" /> Book Session
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                </DialogHeader>
                <AppointmentForm 
                  initialClientId={id}
                  onSuccess={() => {
                    setAppOpen(false);
                    fetchClientData();
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {appointments.map(app => (
              <Link key={app.id} to={`/appointments/\${app.id}`}>
                <Card className="hover:shadow-md transition-all border-slate-200 bg-white group rounded-2xl overflow-hidden cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-600">{(app as any).display_id || app.id.slice(0,8)}</Badge>
                          <span className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{app.name || format(app.date, "MMM d, yyyy")}</span>
                          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">{app.tag}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-500" /> {format(app.date, "EEEE, MMM d")}</span>
                          <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-500" /> {format(app.date, "h:mm a")}</span>
                          <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-bold",
                              app.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                          )}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <ClientProgressTab 
            client={client} 
            appointments={appointments} 
            onRefresh={fetchClientData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailPage;