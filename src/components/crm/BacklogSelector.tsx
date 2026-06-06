
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronDown, 
  Layers, 
  Fingerprint, 
  Target, 
  ShieldAlert,
  Search,
  Loader2,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BacklogSelectorProps {
  type: 'shifting' | 'alignment' | 'belief';
  onSelect: (item: any) => void;
  currentValue?: string;
}

const BacklogSelector = ({ type, onSelect, currentValue }: BacklogSelectorProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchBacklog = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('identity_backlog')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', type)
          .eq('status', 'pending')
          .order('priority_score', { ascending: false });

        if (!error) setItems(data || []);
      } catch (err) {
        console.error("Error fetching backlog for selector:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBacklog();
  }, [type]);

  const getIcon = () => {
    if (type === 'alignment') return <Target size={16} className="text-emerald-500" />;
    if (type === 'belief') return <ShieldAlert size={16} className="text-rose-500" />;
    return <Fingerprint size={16} className="text-indigo-500" />;
  };

  if (loading) return <Button variant="outline" disabled className="h-10 rounded-xl"><Loader2 size={14} className="animate-spin mr-2" /> Loading Map...</Button>;
  if (items.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 rounded-xl border-indigo-100 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 font-bold text-[10px] uppercase tracking-widest gap-2"
        >
          {getIcon()}
          Select from Map
          <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2 rounded-2xl border-none shadow-3xl bg-card">
        <div className="px-3 py-2 mb-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending {type === 'alignment' ? 'Goals' : type === 'belief' ? 'Beliefs' : 'Identities'}</p>
        </div>
        {items.map((item) => (
          <DropdownMenuItem 
            key={item.id} 
            onClick={() => onSelect(item)}
            className="rounded-xl py-3 px-4 cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-indigo-500 opacity-40 group-hover:opacity-100 transition-opacity" />
              <span className="font-bold text-sm truncate">"{item.content}"</span>
            </div>
            {currentValue === item.content && <Check size={14} className="text-indigo-600 shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BacklogSelector;