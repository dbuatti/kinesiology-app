
import React, { useState } from "react";
import { BAGUA_PROFILES, BaGuaProfile } from "@/data/bagua-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Zap, Heart, Activity, Info, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const BaGuaReference = () => {
  const [search, setSearch] = useState("");

  const filtered = BAGUA_PROFILES.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.themes.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    p.meridians.some(m => m.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <Input 
          placeholder="Search by number, name, or theme (e.g. Fear, 9, Heart)..." 
          className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-lg font-medium focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((profile) => (
          <Card key={profile.number} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
            <CardHeader className={cn("pb-6 border-b transition-colors relative", profile.bgColor)}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-white/80 text-slate-900 border-none font-black text-[10px] uppercase tracking-widest">
                      Number {profile.number}
                    </Badge>
                    <Badge className="bg-white/40 text-slate-700 border-none font-black text-[10px] uppercase tracking-widest">
                      {profile.element}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {profile.name}
                  </CardTitle>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/20">
                  <span className={cn("text-2xl font-black", profile.color)}>{profile.number}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-indigo-500" /> Associated Meridians
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.meridians.map(m => (
                    <Badge key={m} variant="secondary" className="bg-indigo-50 text-indigo-700 border-none text-[10px] font-bold">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Heart size={14} className="text-rose-500" /> Emotional Themes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.themes.map(t => (
                    <span key={t} className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mt-auto">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} /> Clinical Insight
                </p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                  "{profile.description}"
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-8 bg-indigo-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={150} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40">
            <Zap size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h4 className="text-2xl font-black">The Ba Gua in Practice</h4>
            <p className="text-indigo-200 font-medium text-lg leading-relaxed">
              "The date of birth model is strangely accurate in uncovering the driving motivational constitution. Each constitution relates to a different aspect of the one key issue all people face: **whether they can connect inwardly and express this outwardly.**"
            </p>
            <div className="pt-4">
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl" asChild>
                <a href="https://takoda.co/bagua" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} className="mr-2" /> Open Original Calculator
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaGuaReference;