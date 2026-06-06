
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Calendar, User, Quote, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface JournalRefresherProps {
  reflectionId: string | null | undefined;
  className?: string;
}

const JournalRefresher = ({ reflectionId, className }: JournalRefresherProps) => {
  const [reflection, setReflection] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReflection = async () => {
      if (!reflectionId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('practitioner_reflections')
          .select('*, appointments(clients(name))')
          .eq('id', reflectionId)
          .single();
        
        if (!error) setReflection(data);
      } catch (err) {
        console.error("Error fetching reflection for refresher:", err);
      } finally {
        setLoading(false);
      }
    };

    if (reflectionId) fetchReflection();
  }, [reflectionId]);

  if (!reflectionId) return null;

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("h-9 w-9 rounded-xl border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 transition-all", className)}
        >
          <BookOpen size={18} />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent 
        side="left" 
        align="start" 
        className="w-80 p-0 rounded-[2rem] border-none shadow-3xl bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-200" />
            <span className="text-[10px] font-black uppercase tracking-widest">Journal Refresher</span>
          </div>
          {reflection && (
            <span className="text-[8px] font-bold opacity-70">
              {format(new Date(reflection.created_at), "MMM d, yyyy")}
            </span>
          )}
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={20} />
            </div>
          ) : reflection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-500 text-[8px] font-black uppercase px-1.5 py-0">
                  {reflection.category}
                </Badge>
                {reflection.appointments?.clients?.name && (
                  <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] font-black uppercase px-1.5 py-0">
                    Client: {reflection.appointments.clients.name}
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[350px] pr-4">
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 text-indigo-50 opacity-50" size={40} />
                  <p className="text-sm font-medium text-slate-700 leading-relaxed relative z-10 italic">
                    {reflection.content}
                  </p>
                </div>
              </ScrollArea>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Source Reflection</p>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-8">Reflection content unavailable.</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default JournalRefresher;