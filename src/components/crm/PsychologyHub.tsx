
import React, { useState } from 'react';
import { Brain, Fingerprint, Target, ShieldAlert, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentWithClient } from '@/types/crm';
import IdentityShiftingTool from './IdentityShiftingTool';
import IdentityAlignmentTool from './IdentityAlignmentTool';
import LimitingBeliefsTool from './LimitingBeliefsTool';

interface PsychologyHubProps {
  appointment: AppointmentWithClient;
}

const TOOLS = [
  {
    id: 'identity-shifting',
    title: 'Identity Shifting',
    description: 'Explore and dissolve problematic identities through neural reconsolidation.',
    icon: Fingerprint,
    component: IdentityShiftingTool,
  },
  {
    id: 'identity-alignment',
    title: 'Identity Alignment',
    description: 'Neural reconsolidation and autonomic safety protocol for identity integration.',
    icon: Target,
    component: IdentityAlignmentTool,
  },
  {
    id: 'limiting-beliefs',
    title: 'Limiting Beliefs',
    description: 'Dissolve limiting beliefs and integrate positive alternatives.',
    icon: ShieldAlert,
    component: LimitingBeliefsTool,
  },
];

const PsychologyHub = ({ appointment }: PsychologyHubProps) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const ActiveToolComponent = TOOLS.find(t => t.id === activeDialog)?.component;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Brain size={20} className="text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Psychology Mastery</h2>
          <p className="text-xs text-muted-foreground">Identity work & belief resolution for {appointment.clients.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        {TOOLS.map(tool => (
          <Card key={tool.id} className={cn(
            "border border-border shadow-none transition-all",
            expandedTool === tool.id ? "bg-card" : "bg-muted/20 hover:bg-muted/40"
          )}>
            <button
              onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <tool.icon size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{tool.title}</span>
                  <p className="text-xs text-muted-foreground/70">{tool.description}</p>
                </div>
              </div>
              {expandedTool === tool.id ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            </button>
            {expandedTool === tool.id && (
              <CardContent className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-muted-foreground">
                  Walk {appointment.clients.name} through the full {tool.title} protocol. No fields are required — navigate freely.
                </p>
                <Button size="sm" className="rounded-lg h-8 text-xs font-medium" onClick={() => setActiveDialog(tool.id)}>
                  <tool.icon size={14} className="mr-1.5" />
                  Launch {tool.title}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Full-screen dialog for active tool */}
      {activeDialog && ActiveToolComponent && (
        <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                {(() => {
                  const tool = TOOLS.find(t => t.id === activeDialog);
                  const Icon = tool?.icon;
                  return Icon ? <Icon size={16} className="text-muted-foreground" /> : null;
                })()}
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{TOOLS.find(t => t.id === activeDialog)?.title}</span>
                <span className="text-xs text-muted-foreground ml-2">· {appointment.clients.name}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg" onClick={() => setActiveDialog(null)}>
              <X size={16} />
            </Button>
          </div>
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            <ActiveToolComponent />
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychologyHub;
