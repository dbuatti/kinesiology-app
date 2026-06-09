
import React, { useState } from 'react';
import { Brain, Fingerprint, Target, ShieldAlert, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppointmentWithClient } from '@/types/crm';

interface PsychologyHubProps {
  appointment: AppointmentWithClient;
}

const TOOLS = [
  {
    id: 'identity-shifting',
    title: 'Identity Shifting',
    description: 'Explore and dissolve problematic identities through neural reconsolidation.',
    icon: Fingerprint,
    sandboxPath: '/sandbox/identity-shifting',
  },
  {
    id: 'identity-alignment',
    title: 'Identity Alignment',
    description: 'Neural reconsolidation and autonomic safety protocol for identity integration.',
    icon: Target,
    sandboxPath: '/sandbox/identity-alignment',
  },
  {
    id: 'limiting-beliefs',
    title: 'Limiting Beliefs',
    description: 'Dissolve limiting beliefs and integrate positive alternatives.',
    icon: ShieldAlert,
    sandboxPath: '/sandbox/limiting-beliefs',
  },
];

const PsychologyHub = ({ appointment }: PsychologyHubProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Brain size={20} className="text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Psychology Mastery</h2>
          <p className="text-xs text-muted-foreground">Identity work & belief resolution tools for {appointment.clients.name}</p>
        </div>
      </div>

      <div className="space-y-2">
        {TOOLS.map(tool => (
          <Card key={tool.id} className={cn(
            "border border-border shadow-none transition-all",
            activeTool === tool.id ? "bg-card" : "bg-muted/20 hover:bg-muted/40"
          )}>
            <button
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
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
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Expand</Badge>
                {activeTool === tool.id ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              </div>
            </button>
            {activeTool === tool.id && (
              <CardContent className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs text-muted-foreground">
                  Launch the full {tool.title} tool for {appointment.clients.name}. Results will be saved to this session.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-lg h-8 text-xs font-medium">
                    <tool.icon size={14} className="mr-1.5" />
                    Launch {tool.title}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs font-medium" asChild>
                    <Link to={tool.sandboxPath} target="_blank">
                      <ExternalLink size={14} className="mr-1" /> Open in Sandbox
                    </Link>
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PsychologyHub;
