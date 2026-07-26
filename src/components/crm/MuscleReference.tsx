
import React, { useState, useEffect, useMemo } from "react";
import { MUSCLE_GROUPS } from "@/data/muscle-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Dumbbell, Info, ImageIcon, 
  LayoutGrid, List, Loader2, Plus, Target,
  Clock, Zap, FilterX, Brain
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import MuscleInfoModal from "./MuscleInfoModal";
import MuscleOfTheDay from "./MuscleOfTheDay";
import MuscleRegionFilter from "./MuscleRegionFilter";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import { isMeridianPeakNow } from "@/utils/crm-utils";

const MuscleReference = () => {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | 'All'>('All');
  const [meridianFilter, setMeridianFilter] = useState<string | 'All'>('All');
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

  const currentPeakMeridian = useMemo(() => {
    const hour = new Date().getHours();
    return TCM_CHANNELS.find(c => isMeridianPeakNow(c.peakTime, hour));
  }, []);

  const allMuscles = useMemo(() => {
    const list: { name: string, group: string }[] = [];
    Object.entries(MUSCLE_GROUPS).forEach(([group, muscles]) => {
      muscles.forEach(m => list.push({ name: m, group }));
    });
    return list;
  }, []);

  const filteredMuscles = allMuscles.filter(m => {
    const info = getMuscleInfo(m.name);
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || m.group === selectedGroup;
    const matchesMeridian = meridianFilter === 'All' || info.meridian === meridianFilter;
    return matchesSearch && matchesGroup && matchesMeridian;
  });

  const handleMuscleClick = (name: string) => {
    setSelectedMuscle(name);
    setModalOpen(true);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedGroup('All');
    setMeridianFilter('All');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Featured Section */}
      <MuscleOfTheDay onViewDetails={handleMuscleClick} />

      {/* Controls Section */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search 60+ muscles (e.g. Psoas, SCM, Deltoid)..." 
              className="pl-12 bg-card border-border rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {currentPeakMeridian && (
              <Button 
                variant={meridianFilter === currentPeakMeridian.name ? "default" : "outline"}
                onClick={() => setMeridianFilter(meridianFilter === currentPeakMeridian.name ? 'All' : currentPeakMeridian.name)}
                className={cn(
                  "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest transition-all",
                  meridianFilter === currentPeakMeridian.name ? "bg-amber-500 text-primary-foreground border-none shadow-lg" : "border-border bg-card hover:bg-muted/50 text-amber-600"
                )}
              >
                <Clock size={16} className="mr-2" /> Peak: {currentPeakMeridian.name}
              </Button>
            )}
            {(search || selectedGroup !== 'All' || meridianFilter !== 'All') && (
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="rounded-xl h-14 px-4 text-rose-600 hover:bg-rose-50"
              >
                <FilterX size={20} />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-2">Filter by Body Region</p>
          <MuscleRegionFilter activeRegion={selectedGroup} onRegionChange={setSelectedGroup} />
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMuscles.map(muscle => {
          const data = customizations[muscle.name];
          const hasImages = data?.image_url || data?.secondary_image_url;
          const info = getMuscleInfo(muscle.name);

          return (
            <Card 
              key={muscle.name} 
              className="border-none shadow-md rounded-[2rem] bg-card hover:shadow-xl transition-all group overflow-hidden cursor-pointer flex flex-col h-full"
              onClick={() => handleMuscleClick(muscle.name)}
            >
              <div className="aspect-video bg-muted/50 relative overflow-hidden border-b border-border/50">
                {data?.image_url ? (
                  <img src={data.image_url} alt={muscle.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60">
                    <ImageIcon size={32} className="mb-2 opacity-20" />
                    <p className="text-[8px] font-black uppercase tracking-widest">No Main Image</p>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-1">
                  {hasImages && (
                    <Badge className="bg-emerald-500 text-primary-foreground border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5">
                      Custom
                    </Badge>
                  )}
                  <Badge className="bg-card/80 backdrop-blur-sm text-foreground border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5">
                    {info.meridian}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-lg text-foreground group-hover:text-indigo-600 transition-colors truncate">{muscle.name}</h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{muscle.group}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    <Brain size={12} className="text-indigo-400" />
                    <span className="truncate">{info.brainstemControl || 'General Control'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    <Zap size={12} className="text-amber-400" />
                    <span className="truncate">{info.nerveSupply || 'Spinal Nerve'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                  <div className="flex gap-1">
                    {data?.image_url && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    {data?.secondary_image_url && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-primary-foreground transition-all">
                    <Target size={16} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMuscles.length === 0 && (
        <div className="text-center py-32 bg-muted/50 rounded-[3rem] border-2 border-dashed border-border">
          <Dumbbell size={48} className="mx-auto text-muted-foreground/60 mb-4" />
          <h3 className="text-xl font-black text-foreground">No muscles found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or group filter.</p>
          <Button variant="link" onClick={resetFilters} className="mt-4 text-indigo-600 font-bold">Clear All Filters</Button>
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