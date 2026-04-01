"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Loader2, 
  RefreshCw, 
  ChevronRight, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Info,
  Settings2
} from "lucide-react";
import { format, addWeeks, startOfToday, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

const CalcomSlotsView = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(4);
  const [eventTypeId, setEventTypeId] = useState<string>(() => localStorage.getItem('calcom_preferred_event_id') || "");

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = startOfToday().toISOString();
      const end = endOfDay(addWeeks(new Date(), weeks)).toISOString();
      
      const { data, error: invokeError } = await supabase.functions.invoke('get-calcom-slots', {
        body: { 
          start, 
          end,
          eventTypeId: eventTypeId || undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });

      if (invokeError) throw invokeError;
      
      if (data.status === 'error') {
        setError(data.message);
        return;
      }

      setSlots(data.data || {});
      if (Object.keys(data.data || {}).length > 0) {
        showSuccess("Availability updated.");
      }
      
      if (eventTypeId) {
        localStorage.setItem('calcom_preferred_event_id', eventTypeId);
      }
    } catch (err: any) {
      console.error("Failed to fetch slots:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [weeks]);

  const dates = Object.keys(slots).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-indigo-500" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Lookahead Range</label>
              <div className="flex bg-muted p-1 rounded-xl w-max">
                {[2, 4, 6, 8].map(w => (
                  <Button 
                    key={w}
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setWeeks(w)}
                    className={cn(
                      "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      weeks === w ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {w} Weeks
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Event Type ID (Optional)</label>
              <Input 
                placeholder="Auto-detecting..." 
                value={eventTypeId}
                onChange={(e) => setEventTypeId(e.target.value)}
                className="h-10 rounded-xl bg-muted/50 border-none font-bold text-xs"
              />
            </div>
          </div>
        </div>
        
        <Button 
          onClick={fetchSlots} 
          disabled={loading}
          className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
        >
          {loading ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
          Refresh Availability
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertDescription className="text-sm text-rose-900 font-bold">
            Error: {error}
            <p className="mt-2 text-xs font-medium text-rose-700">
              Ensure your CALCOM_API_KEY is set in Supabase Secrets and that you have active event types in Cal.com.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {loading && Object.keys(slots).length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching Cal.com Slots...</p>
        </div>
      ) : dates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dates.map(date => (
            <Card key={date} className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900">
                        {format(new Date(date), "EEEE")}
                      </CardTitle>
                      <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-indigo-600">
                        {format(new Date(date), "MMMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] uppercase tracking-widest">
                    {slots[date].length} Slots
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-2">
                  {slots[date].map((slot, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all cursor-default"
                    >
                      <Clock size={12} className="mr-2 opacity-40" />
                      {format(new Date(slot.start), "h:mm a")}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CalendarDays size={40} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No availability found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium">
            Check your Cal.com schedule or ensure your API key is correctly configured in Supabase.
          </p>
        </div>
      )}

      <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-start gap-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shrink-0">
          <Info size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-indigo-400">Practitioner Note</h4>
          <p className="text-slate-300 font-medium leading-relaxed italic">
            "This view shows your live availability as seen by clients. Use this to quickly confirm openings when talking to a client without leaving the CRM."
          </p>
        </div>
      </div>
    </div>
  );
};

export default CalcomSlotsView;