import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/crm/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { CALCOM_CONFIG } from "@/config/integrations";

type DurationOption = "60" | "45" | "30";

const DURATIONS: { key: DurationOption; label: string; url: string; price: string }[] = [
  { key: "60", label: "60 minutes", url: CALCOM_CONFIG.VOICE_COACHING_URL, price: "$95" },
  { key: "45", label: "45 minutes", url: CALCOM_CONFIG.VOICE_COACHING_45_URL, price: "$75" },
  { key: "30", label: "30 minutes", url: CALCOM_CONFIG.VOICE_COACHING_30_URL, price: "$50" },
];

const VoiceBookLessonPage = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState<DurationOption>("60");
  const selected = DURATIONS.find((d) => d.key === duration)!;

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title="Book a Lesson"
          subtitle="Schedule a voice or piano coaching session."
          icon={Mic}
          iconClassName="bg-rose-500 text-primary-foreground dark:bg-rose-500 dark:text-primary-foreground"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="h-10 px-4 rounded-xl border-border font-bold text-[10px] uppercase tracking-widest gap-2"
              >
                <ArrowLeft size={14} />
                Back
              </Button>
              <a href={selected.url} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-[10px] uppercase tracking-widest gap-2"
                >
                  <ExternalLink size={14} />
                  Open in New Tab
                </Button>
              </a>
            </div>
          }
        />

        {/* Duration toggle */}
        <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border w-fit">
          {DURATIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDuration(d.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                duration === d.key
                  ? "bg-rose-500 text-primary-foreground shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock size={14} />
              {d.label}
              <span className="font-black">{d.price}</span>
            </button>
          ))}
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-xl">
          <iframe
            src={`${selected.url}?embed=1`}
            width="100%"
            height="900"
            frameBorder="0"
            title="Book a Voice Coaching Session"
            className="w-full"
            style={{ minHeight: "700px" }}
            allow="calendar *; clipboard-read; clipboard-write"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default VoiceBookLessonPage;
