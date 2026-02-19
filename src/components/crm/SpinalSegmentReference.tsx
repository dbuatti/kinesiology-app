"use client";

import React, { useState, useMemo } from "react";
import { VAGUS_ASSOCIATIONS } from "@/data/vagus-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Move, Activity, Zap, RefreshCw, Info, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MuscleInfoModal from "./MuscleInfoModal";
import { Button } from "@/components/ui/button";

const SpinalSegmentReference = () => {
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAssociations = VAGUS_ASSOCIATIONS.filter(a => 
    a.spinalSegment.toLowerCase().includes(search.toLowerCase()) ||
    a.muscle.toLowerCase().includes(search.toLowerCase()) ||
    a.organ.toLowerCase().includes(search.toLowerCase()) ||
    a.reciprocatingSegment.toLowerCase().includes(search.toLowerCase())
  );

  const handleMuscleClick = (muscleName: string) => {
    setSelectedMuscle(muscleName);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="Search by segment (C1), muscle (Psoas), or organ (Kidney)..." 
          className="pl-12 bg-white border-slate-200 rounded-2xl h-14 shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssociations.map((assoc) => {
          const muscleInfo = getMuscleInfo(assoc.muscle);
          const meridian = muscleInfo.meridian;

          return (
            <Card key={assoc.spinalSegment} className="border-none shadow-md rounded-[2rem] bg-white hover:shadow-xl transition-all group overflow-hidden">
              <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest">
                        Spinal Segment
                      </Badge>
                      {meridian && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest">
                          {meridian}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {assoc.spinalSegment}
                    </CardTitle>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Move size={24} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => handleMuscleClick(assoc.muscle)}
                    className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-left hover:bg-indigo-100 transition-colors group/muscle"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={12} /> Associated Muscle
                      </p>
                      <Info size={12} className="text-indigo-300 group-hover/muscle:text-indigo-600 transition-colors" />
                    </div>
                    <p className="text-lg font-black text-indigo-900 group-hover/muscle:underline decoration-indigo-300 underline-offset-4">
                      {assoc.muscle}
                    </p>
                    {meridian && (
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Layers size={10} /> {meridian} Meridian
                      </p>
                    )}
                  </button>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Activity size={12} /> Organ / Gland
                    </p>
                    <p className="text-lg font-black text-slate-900">{assoc.organ}</p>
                  </div>
                </div>
                
                <div className="p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <RefreshCw size={40} className="text-rose-600" />
                  </div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <RefreshCw size={12} /> Lovett-Brother Partner
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-rose-600">{assoc.reciprocatingSegment}</p>
                    <span className="text-xs font-bold text-rose-400">Reciprocating Segment</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssociations.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="mx-auto w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl">
            <Search size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900">No associations found</h3>
          <p className="text-slate-500 mt-2">Try searching for a different segment, muscle, or organ.</p>
        </div>
      )}

      <MuscleInfoModal 
        muscleName={selectedMuscle}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default SpinalSegmentReference;