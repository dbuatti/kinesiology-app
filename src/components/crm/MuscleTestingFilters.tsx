"use client";

import React from "react";
import { Search, Layers, Eye, AlertTriangle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TCM_CHANNELS } from "@/data/tcm-channel-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MuscleTestingFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  meridianFilter: string;
  setMeridianFilter: (val: string) => void;
  showOnlyTested: boolean;
  setShowOnlyTested: (val: boolean) => void;
  showOnlyDysfunctional: boolean;
  setShowOnlyDysfunctional: (val: boolean) => void;
  onToggleAllGroups: () => void;
  isAllExpanded: boolean;
}

const MuscleTestingFilters = ({
  searchTerm,
  setSearchTerm,
  meridianFilter,
  setMeridianFilter,
  showOnlyTested,
  setShowOnlyTested,
  showOnlyDysfunctional,
  setShowOnlyDysfunctional,
  onToggleAllGroups,
  isAllExpanded
}: MuscleTestingFiltersProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search muscles (e.g. Psoas, Deltoid)..." 
            className="pl-12 bg-white border-slate-200 h-12 rounded-2xl shadow-sm font-medium focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={meridianFilter} onValueChange={setMeridianFilter}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                <SelectValue placeholder="Filter by Meridian" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              <SelectItem value="all" className="rounded-xl">All Meridians</SelectItem>
              {TCM_CHANNELS.map(channel => (
                <SelectItem key={channel.id} value={channel.name} className="rounded-xl">
                  {channel.name} ({channel.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          className="w-full md:w-auto rounded-xl h-12 px-6 border-slate-200 font-bold text-slate-600"
          onClick={onToggleAllGroups}
        >
          {isAllExpanded ? "Collapse All" : "Expand All"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-tested" 
            checked={showOnlyTested} 
            onCheckedChange={setShowOnlyTested} 
            className="data-[state=checked]:bg-indigo-600"
          />
          <Label htmlFor="show-tested" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1.5">
            <Eye size={14} className="text-indigo-500" /> Show Only Tested
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-dysfunctional" 
            checked={showOnlyDysfunctional} 
            onCheckedChange={setShowOnlyDysfunctional} 
            className="data-[state=checked]:bg-rose-600"
          />
          <Label htmlFor="show-dysfunctional" className="text-xs font-bold text-slate-600 cursor-pointer flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-rose-500" /> Show Only Dysfunctional
          </Label>
        </div>
        {(showOnlyTested || showOnlyDysfunctional || searchTerm || meridianFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setShowOnlyTested(false);
              setShowOnlyDysfunctional(false);
              setSearchTerm("");
              setMeridianFilter("all");
            }}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 h-7 px-3 rounded-lg"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default MuscleTestingFilters;