
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Copy, Check } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const CalcomSettings = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const projectRef = "xebtjnvfkroiplyzftas";
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/calcom-webhook`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black flex items-center gap-3">
          <Calendar size={24} className="text-amber-500" /> Cal.com Webhook Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Your Unique Endpoint</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/40 border border-border rounded-xl px-4 py-3 text-xs font-mono text-slate-600 dark:text-muted-foreground truncate flex items-center">
              {webhookUrl}
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={() => handleCopy(webhookUrl, 'web')}>
              {copied === 'web' ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalcomSettings;