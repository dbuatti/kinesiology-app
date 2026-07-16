
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, Activity, ShieldAlert, Heart, 
  Briefcase, MapPin, Calendar, Info,
  AlertCircle, Zap, Brain, Wind, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseClientJournal } from "@/utils/journal-helper";

interface ClientContextTabProps {
  appointment: any;
}

const ClientContextTab = ({ appointment }: ClientContextTabProps) => {
  const client = appointment.clients;
  const journalNotes = client?.journal ? parseClientJournal(client.journal).notes : null;
  
  // Prioritize appointment-specific data, fallback to client profile
  const stressLevel = appointment.current_stress_level ?? client.current_stress_level;
  const sleepQuality = appointment.sleep_quality ?? client.sleep_quality;
  const digestiveHealth = appointment.digestive_health ?? client.digestive_health;
  const medications = appointment.medications_supplements ?? client.medications_supplements;

  const Section = ({ icon: Icon, title, children, color }: any) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-2">
        <Icon size={14} className={color} />
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      </div>
      <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Section icon={Activity} title="Medical History & Injuries" color="text-chart-destructive">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {client.medical_history || "No medical history recorded."}
            </p>
          </Section>

          <Section icon={Zap} title="Medications & Supplements" color="text-muted-foreground">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {medications || "No medications recorded."}
            </p>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-muted rounded-xl border border-border">
              <p className="text-[10px] font-semibold text-chart-primary uppercase tracking-wider mb-2">Stress Level</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-chart-primary">{stressLevel || "—"}</span>
                <span className="text-xs font-medium text-chart-primary">/ 10</span>
              </div>
            </div>
            <div className="p-5 bg-muted rounded-xl border border-border">
              <p className="text-[10px] font-semibold text-chart-emerald uppercase tracking-wider mb-2">Sleep Quality</p>
              <p className="text-sm font-medium text-chart-emerald">{sleepQuality || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Section icon={ShieldAlert} title="Safety & Emergency" color="text-chart-destructive">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Contact Name</p>
                <p className="text-sm font-medium text-foreground">{client.emergency_contact_name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Contact Phone</p>
                <p className="text-sm font-medium text-foreground">{client.emergency_contact_phone || "Not provided"}</p>
              </div>
            </div>
          </Section>

          <Section icon={Info} title="Background Context" color="text-chart-primary">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Occupation</p>
                <p className="text-sm font-medium text-foreground">{client.occupation || "Not set"}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Referral Source</p>
                <p className="text-sm font-medium text-foreground">{client.referral_source || "Not set"}</p>
              </div>
            </div>
          </Section>

          {journalNotes && (
            <Section icon={BookOpen} title="Practitioner Notes" color="text-chart-primary">
              <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {journalNotes}
              </p>
            </Section>
          )}

          <div className="p-6 bg-foreground/10 text-foreground rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Brain size={80} /></div>
            <h4 className="text-xs font-semibold text-chart-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle size={14} /> Practitioner Insight
            </h4>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed italic relative z-10">
              "Use this context to identify potential emotional triggers or structural patterns before starting the balance."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientContextTab;