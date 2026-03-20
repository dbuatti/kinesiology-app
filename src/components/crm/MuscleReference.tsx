"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MUSCLE_GROUPS } from "@/data/muscle-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Dumbbell, Info, ImageIcon, 
  LayoutGrid, List, Loader2, Plus, Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import MuscleInfoModal from "./MuscleInfoModal";

const MuscleReference = () => {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | 'All'>('All');
  const [customizations, setCustomizations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('muscle_customizations')
          .select('muscle_name, image_url, secondary_image_url')
          .eq('user_id', user.id);
        
        const mapping: Record<string, any> = {};
        data?.forEach(item => { 
          mapping[item.muscle_name] = item;
        });
        setCustomizations(mapping);
      } catch (err) {
        console.error("Failed to fetch customizations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomizations();
  }, []);

  const allMuscles = useMemo(() => {
    const list: { name: string, group: string }[] = [];
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      muscles.forEach(m => list.push({ name: m, group }));
    });
    return list;
  }, []);

  const filteredMuscles = allMuscles.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || m.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleMuscleClick = (name: string) => {
    setSelectedMuscle(name);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search muscles (e.g. Psoas, SCM)..." 
            className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant={selectedGroup === 'All' ? "default" : "outline"}
            onClick={() => setSelectedGroup('All')}
            className="rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap"
          >
            All Groups
          </Button>
          {Object.keys(MUSCLE_GROUPS).map(group => (
            <Button 
              key={group}
              variant={selectedGroup === group ? "default" : "outline"}
              onClick={() => setSelectedGroup(group)}
              className={cn(
                "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
                selectedGroup === group ? "bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              {group}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMuscles.map(muscle => {
          const data = customizations[muscle.name];
          const hasImages = data?.image_url || data?.secondary_image_url;

          return (
            <Card 
              key={muscle.name} 
              className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
              onClick={() => handleMuscleClick(muscle.name)}
            >
              <div className="aspect-video bg-slate-50 relative overflow-hidden border-b border-slate-100">
                {data?.image_url ? (
                  <img src={data.image_url} alt={muscle.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-[8px] font-black uppercase tracking-widest">No Main Image</p>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className={cn(
                    "border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5",
                    hasImages ? "bg-emerald-50 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {hasImages ? 'Customized' : 'Standard'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6 space-y-3">
                <div>
                  <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{muscle.name}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{muscle.group}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1">
                    {data?.image_url && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    {data?.secondary_image_url && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Target size={16} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMuscles.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <Dumbbell size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-black text-slate-900">No muscles found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search or group filter.</p>
        </div>
      )}

      <MuscleInfoModal 
        muscleName={selectedMuscle}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default MuscleReference;