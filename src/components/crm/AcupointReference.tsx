"use client";

import React, { useState } from "react";
import { ACUPOINTS, Acupoint } from "@/data/acupoint-data";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Zap, Info, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AcupointReference = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(ACUPOINTS.map(p => p.category)));

  const filteredPoints = ACUPOINTS.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(search.toLowerCase()) || 
                         p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.function.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by code (GV20), name, or function..." 
            className="pl-10 bg-white border-slate-200 rounded-xl h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button 
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-xl h-12 px-4 font-bold text-xs uppercase tracking-widest"
          >
            All
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-xl h-12 px-4 font-bold text-xs uppercase tracking-widest whitespace-nowrap",
                selectedCategory === cat ? "bg-indigo-600" : "border-slate-200"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPoints.map(point => (
          <Card key={point.code} className="border-none shadow-md rounded-2xl bg-white hover:shadow-xl transition-all group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest mb-2">
                    {point.category} Meridian
                  </Badge>
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {point.code}
                  </CardTitle>
                  <p className="text-sm font-bold text-slate-500">{point.name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Zap size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <MapPin size={10} /> Location
                </p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{point.location}</p>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Info size={10} /> Clinical Function
                </p>
                <p className="text-xs text-slate-800 font-bold leading-relaxed">{point.function}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPoints.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No points found</h3>
          <p className="text-slate-500">Try adjusting your search or category filter.</p>
        </div>
      )}
    </div>
  );
};

export default AcupointReference;