"use client";

import React, { useState } from "react";
import { CRANIAL_NERVES, CranialNerve } from "@/data/cranial-nerve-data";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  Zap, 
  Star, 
  Trophy, 
  Filter, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CranialNerveAssessmentProps {
  appointmentId: string;
}

export function CranialNerveAssessment({ appointmentId }: CranialNerveAssessmentProps) {
  const { tests, loading, updateTest } = useCranialNerveTests(appointmentId);
  const [showOnlyInhibited, setShowOnlyInhibited] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNerve, setExpandedNerve] = useState<number | null>(null);

  const getTestData = (nerveId: number) => {
    return tests.find(t => t.nerve_id === nerveId.toString()) || {
      is_inhibited: false,
      is_stimulated: false,
      is_priority: false,
      is_primary_priority: false,
      notes: ""
    };
  };

  const filteredNerves = CRANIAL_NERVES.filter(nerve => {
    const test = getTestData(nerve.id);
    const matchesSearch = nerve.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         nerve.latinName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInhibited = showOnlyInhibited ? test.is_inhibited : true;
    return matchesSearch && matchesInhibited;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading assessment...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nerves..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="inhibited-filter"
              checked={showOnlyInhibited}
              onCheckedChange={setShowOnlyInhibited}
            />
            <Label htmlFor="inhibited-filter" className="text-sm font-medium cursor-pointer">
              Show Only Inhibited
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-background">
            {tests.filter(t => t.is_inhibited).length} Inhibited
          </Badge>
          <Badge variant="outline" className="bg-background">
            {tests.filter(t => t.is_priority).length} Priority
          </Badge>
          {tests.some(t => t.is_primary_priority) && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Primary Selected
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNerves.map((nerve) => {
          const test = getTestData(nerve.id);
          const isExpanded = expandedNerve === nerve.id;

          return (
            <Card 
              key={nerve.id} 
              className={cn(
                "transition-all duration-200 border-l-4",
                test.is_primary_priority ? "ring-2 ring-primary border-l-primary" : 
                test.is_priority ? "border-l-amber-500" : 
                test.is_inhibited ? "border-l-destructive" : "border-l-muted"
              )}
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded text-white", nerve.color)}>
                      {nerve.name}
                    </span>
                    <CardTitle className="text-base">{nerve.latinName}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">{nerve.nuclei} • {nerve.toneEffect}</p>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setExpandedNerve(isExpanded ? null : nerve.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isExpanded ? "Show less" : "Show details"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_inhibited ? "destructive" : "outline"}
                          size="sm"
                          className="h-9 px-0 flex flex-col gap-0.5"
                          onClick={() => updateTest(nerve.id.toString(), { is_inhibited: !test.is_inhibited })}
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase font-bold">Reflex</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{test.is_inhibited ? "Mark as Clear" : "Mark as Inhibited"}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_stimulated ? "secondary" : "outline"}
                          size="sm"
                          disabled={!test.is_inhibited}
                          className="h-9 px-0 flex flex-col gap-0.5"
                          onClick={() => updateTest(nerve.id.toString(), { is_stimulated: !test.is_stimulated })}
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase font-bold">Stim</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Toggle Stimulation</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-9 px-0 flex flex-col gap-0.5",
                            test.is_priority && "bg-amber-500 text-white hover:bg-amber-600 border-amber-600"
                          )}
                          onClick={() => updateTest(nerve.id.toString(), { is_priority: !test.is_priority })}
                        >
                          <Star className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase font-bold">P</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark as Priority</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={test.is_primary_priority ? "default" : "outline"}
                          size="sm"
                          className="h-9 px-0 flex flex-col gap-0.5"
                          onClick={() => updateTest(nerve.id.toString(), { is_primary_priority: !test.is_primary_priority })}
                        >
                          <Trophy className="h-3.5 w-3.5" />
                          <span className="text-[10px] uppercase font-bold">PP</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark as Primary Priority</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Nuclei</p>
                        <p className="text-xs font-medium">{nerve.nuclei}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Tone Effect</p>
                        <p className="text-xs font-medium">{nerve.toneEffect}</p>
                      </div>
                    </div>
                    {nerve.acupoint && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Acupoint</p>
                        <Badge variant="secondary" className="text-[10px] h-5">{nerve.acupoint}</Badge>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Reflex Point</p>
                      <p className="text-xs">{nerve.reflexPoint}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Stimulus</p>
                      <p className="text-xs">{nerve.stimulus}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Functions</p>
                      <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                        {nerve.functions.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Clinical Pearl</p>
                      <p className="text-xs italic text-muted-foreground">"{nerve.clinicalPearl}"</p>
                    </div>
                    {(nerve.videoUrl || nerve.pageUrl) && (
                      <div className="flex gap-2 pt-1">
                        {nerve.videoUrl && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                            <a href={nerve.videoUrl} target="_blank" rel="noopener noreferrer">Watch Video</a>
                          </Button>
                        )}
                        {nerve.pageUrl && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                            <a href={nerve.pageUrl} target="_blank" rel="noopener noreferrer">View Details</a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <Input
                    placeholder="Add notes..."
                    className="h-8 text-xs pr-8"
                    value={test.notes || ""}
                    onChange={(e) => updateTest(nerve.id.toString(), { notes: e.target.value })}
                  />
                  <Info className="absolute right-2 top-2 h-4 w-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredNerves.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/10">
          <Filter className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-medium">No nerves match your filters</p>
          <Button 
            variant="link" 
            onClick={() => {
              setShowOnlyInhibited(false);
              setSearchQuery("");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
