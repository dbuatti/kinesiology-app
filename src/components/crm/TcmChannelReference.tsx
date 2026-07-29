
import React, { useState, useEffect } from "react";
import { TCM_CHANNELS, TcmChannel, TcmElement } from "@/data/tcm-channel-data";
import { ACUPOINTS } from "@/data/acupoint-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Clock, Zap, Heart, Activity, Dumbbell, Target, MousePointer2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import MuscleInfoModal from "./MuscleInfoModal";
import { isMeridianPeakNow } from "@/utils/crm-utils";

const TcmChannelReference = () => {
  const [search, setSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState<TcmElement | 'All'>('All');
  const [currentTime, setCurrentTime] = useState(new Date().getHours());
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const elements: (TcmElement | 'All')[] = ['All', 'Wood', 'Fire', 'Earth', 'Metal', 'Water'];

  const filteredChannels = TCM_CHANNELS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                         c.code.toLowerCase().includes(search.toLowerCase()) ||
                         c.description.toLowerCase().includes(search.toLowerCase());
    const matchesElement = selectedElement === 'All' || c.element === selectedElement;
    return matchesSearch && matchesElement;
  });

  const handleMuscleClick = (muscle: string) => {
    setSelectedMuscle(muscle);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search channels (e.g. Lung, LV, Respiration)..." 
            className="pl-12 bg-card border-border rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {elements.map(el => (
            <Button 
              key={el}
              variant={selectedElement === el ? "default" : "outline"}
              onClick={() => setSelectedElement(el)}
              className={cn(
                "rounded-xl h-14 px-6 font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all",
                selectedElement === el ? "bg-foreground shadow-lg" : "border-border bg-card hover:bg-muted/50"
              )}
            >
              {el}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredChannels.map(channel => {
          const isPeak = isMeridianPeakNow(channel.peakTime, currentTime);
          const associatedPoints = ACUPOINTS.filter(p => 
            p.category === channel.name || 
            (channel.id === 'CV' && p.category === 'Conception') ||
            (channel.id === 'GV' && p.category === 'Governing') ||
            (channel.id === 'SJ' && p.category === 'Triple Warmer')
          );

          return (
            <Card key={channel.id} className="border-none shadow-lg rounded-[2.5rem] bg-card hover:shadow-2xl transition-all group overflow-hidden">
              <CardHeader className={cn("pb-6 border-b transition-colors relative", channel.color)}>
                {isPeak && (
                  <div className="absolute top-4 right-4 animate-pulse">
                    <Badge className="bg-card text-foreground border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                      <Zap size={10} className="mr-1 fill-amber-400 text-amber-400" /> Peak Now
                    </Badge>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-card/20 text-primary-foreground border-none font-black text-[9px] uppercase tracking-widest">
                        {channel.element}
                      </Badge>
                      <Badge className="bg-card/20 text-primary-foreground border-none font-black text-[9px] uppercase tracking-widest">
                        {channel.yinYang}
                      </Badge>
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight">
                      {channel.name}
                    </CardTitle>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-[0.2em]">{channel.code} Meridian</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-card/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <Activity size={28} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                    isPeak ? "bg-amber-50 border-amber-200 shadow-inner" : "bg-muted/50 border-border/50"
                  )}>
                    <Clock size={18} className={isPeak ? "text-amber-600" : "text-indigo-500"} />
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Peak Time</p>
                      <p className={cn("text-sm font-bold", isPeak ? "text-amber-900" : "text-foreground")}>{channel.peakTime}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {channel.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Heart size={14} className="text-rose-500" /> Core Emotions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {channel.emotions.slice(0, 6).map(emotion => (
                      <Badge key={emotion} variant="outline" className="bg-rose-50/50 border-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-lg">
                        {emotion}
                      </Badge>
                    ))}
                    {channel.emotions.length > 6 && (
                      <span className="text-[10px] font-bold text-muted-foreground ml-1">+{channel.emotions.length - 6} more</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target size={14} className="text-emerald-500" /> Primary Acupoints
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {associatedPoints.map(point => (
                      <Badge key={point.code} className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black px-3 py-1 rounded-lg">
                        {point.code}
                      </Badge>
                    ))}
                    {associatedPoints.length === 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground italic">Reference charts for points</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <Dumbbell size={14} className="text-indigo-500" /> Associated Muscles
                    </h4>
                    <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1">
                      <MousePointer2 size={8} /> Click for info
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {channel.muscles.map(muscle => (
                      <button 
                        key={muscle}
                        onClick={() => handleMuscleClick(muscle)}
                        className="bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-primary-foreground hover:border-indigo-600 transition-all"
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-32 bg-muted/50 rounded-[3rem] border-2 border-dashed border-border">
          <div className="mx-auto w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <Search size={40} className="text-muted-foreground/60" />
          </div>
          <h3 className="text-xl font-black text-foreground">No channels found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or element filter.</p>
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

export default TcmChannelReference;