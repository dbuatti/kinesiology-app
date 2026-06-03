"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Merge, Loader2, ArrowRightLeft } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface ManualMergeFormProps {
  clients: Client[];
  loadingClients: boolean;
  merging: boolean;
  onMerge: (sourceId: string, targetId: string) => void;
}

const ManualMergeForm = ({
  clients,
  loadingClients,
  merging,
  onMerge
}: ManualMergeFormProps) => {
  const [sourceClientId, setSourceClientId] = useState<string>("");
  const [targetClientId, setTargetClientId] = useState<string>("");

  const handleMerge = () => {
    if (sourceClientId && targetClientId) {
      onMerge(sourceClientId, targetClientId);
    }
  };

  const sourceClient = clients.find(c => c.id === sourceClientId);
  const targetClient = clients.find(c => c.id === targetClientId);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Merge Override</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duplicate Client (To Remove)</label>
          <Select value={sourceClientId} onValueChange={setSourceClientId} disabled={loadingClients || merging}>
            <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/40 border-border">
              <SelectValue placeholder={loadingClients ? "Loading..." : "Select duplicate..."} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Client (To Keep)</label>
          <Select value={targetClientId} onValueChange={setTargetClientId} disabled={loadingClients || merging}>
            <SelectTrigger className="h-12 rounded-xl font-bold bg-muted/40 border-border">
              <SelectValue placeholder={loadingClients ? "Loading..." : "Select primary..."} />
            </SelectTrigger>
            <SelectContent className="max-h-[250px]">
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {sourceClientId && targetClientId && sourceClient && targetClient && (
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
          <ArrowRightLeft size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-900">Merge Action Summary:</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              All appointments for <strong>{sourceClient.name}</strong> will be moved to <strong>{targetClient.name}</strong>. The duplicate page in Notion will be archived, and the duplicate profile in the CRM will be deleted.
            </p>
          </div>
        </div>
      )}

      <Button 
        onClick={handleMerge}
        disabled={merging || !sourceClientId || !targetClientId || sourceClientId === targetClientId}
        className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-100"
      >
        {merging ? <Loader2 className="mr-2 animate-spin" /> : <Merge size={18} className="mr-2" />}
        Merge Client Profiles
      </Button>
    </div>
  );
};

export default ManualMergeForm;