import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { profileSections, type TranscriptProfile } from "@/lib/transcriptProfile";

interface TranscriptOnboardingProps {
  profile: TranscriptProfile | null;
  onProfile: (profile: TranscriptProfile | null) => void;
}

/**
 * Paste (or upload) the transcript of a first conversation and have it read
 * into an onboarding profile: who they are, goals, challenges, logistics and
 * what to cover first. The parent prefills the New student form from it.
 */
const TranscriptOnboarding = ({ profile, onProfile }: TranscriptOnboardingProps) => {
  const [transcript, setTranscript] = useState("");
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setTranscript(await file.text());
    } catch {
      showError("Couldn't read that file — paste the text instead.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRead = async () => {
    if (!transcript.trim()) return;
    setReading(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-transcript-profile", {
        body: { transcript: transcript.trim() },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Couldn't build a profile");
      onProfile(data.profile as TranscriptProfile);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Couldn't build a profile");
    } finally {
      setReading(false);
    }
  };

  if (profile) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Profile from the conversation</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {profile.name || "New student"}
              <span className="ml-2 text-[13px] font-normal text-muted-foreground capitalize">
                {profile.practice}{profile.level ? ` · ${profile.level}` : ""}
              </span>
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-[13px]" onClick={() => onProfile(null)}>
            <X size={14} />
            Start over
          </Button>
        </div>

        <dl className="space-y-4">
          {profileSections(profile).map((s) => (
            <div key={s.label} className="space-y-1">
              <dt className="text-[12px] font-medium text-muted-foreground">{s.label}</dt>
              <dd className="text-[14px] leading-relaxed text-foreground">
                {s.items ? (
                  <ul className="list-disc space-y-0.5 pl-5">
                    {s.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                ) : (
                  s.text
                )}
              </dd>
            </div>
          ))}
        </dl>

        <p className="text-[12px] text-muted-foreground">
          Check the details below — this whole profile is saved as their onboarding notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <FileText size={15} className="text-muted-foreground" />
          Start from a conversation
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Paste the transcript of your first chat and it will be read into a profile — goals, background,
          challenges, logistics and what to work on first — and fill in the form below.
        </p>
      </div>

      <Textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste the meeting transcript here…"
        className="min-h-[180px] rounded-xl text-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleRead} disabled={reading || !transcript.trim()} className="gap-2">
          {reading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {reading ? "Reading transcript…" : "Build profile"}
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <Upload size={15} />
          Upload .txt / .vtt
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.vtt,.srt,.md,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
};

export default TranscriptOnboarding;
