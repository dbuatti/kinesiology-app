import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { VoiceStudentOption } from "@/types/assistant";
import { voiceStudentIdFor } from "@/lib/voice-student-id";
import { Users, Mic, Brain } from "lucide-react";
import type { PersonOption } from "@/lib/people";

interface Props {
  /** Everyone, one entry per person (Phase 5). */
  people: PersonOption[];
  /** Students who booked but have no record yet — shown only if not already in people. */
  voiceStudents: VoiceStudentOption[];
  value: string | null;
  onChange: (clientId: string | null) => void;
}

const GENERAL_VALUE = "__general__";

const PracticeIcons = ({ practices }: { practices: PersonOption["practices"] }) => (
  <span className="ml-auto flex items-center gap-1 pl-2 text-muted-foreground">
    {practices.includes("kinesiology") && <Brain className="h-3 w-3" />}
    {practices.some((p) => p !== "kinesiology") && <Mic className="h-3 w-3" />}
  </span>
);

export default function ClientPicker({ people, voiceStudents, value, onChange }: Props) {
  const { recentClients } = useRecentClients();
  const recentIds = new Set(recentClients.map((c) => c.id));
  const others = people.filter((c) => !recentIds.has(c.id));
  // Recent list can outlive the person (renamed/deleted) — only show ones that still resolve.
  const validRecent = people.filter((p) => recentIds.has(p.id));
  const known = new Set(people.map((p) => (p.email || "").toLowerCase()).filter(Boolean));
  const unlinked = voiceStudents.filter((s) => !known.has(s.email.toLowerCase()));

  const item = (p: PersonOption) => (
    <SelectItem key={p.id} value={p.id}>
      <span className="flex w-full items-center">{p.name}<PracticeIcons practices={p.practices} /></span>
    </SelectItem>
  );

  return (
    <Select value={value || GENERAL_VALUE} onValueChange={(v) => onChange(v === GENERAL_VALUE ? null : v)}>
      <SelectTrigger className="w-[220px]">
        <div className="flex items-center gap-2 truncate">
          <Users className="h-4 w-4 shrink-0 opacity-60" />
          <SelectValue placeholder="General mode" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={GENERAL_VALUE}>General (no client focus)</SelectItem>
        {validRecent.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Recent</SelectLabel>
              {validRecent.map(item)}
            </SelectGroup>
          </>
        )}
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>People</SelectLabel>
          {others.map(item)}
        </SelectGroup>
        {unlinked.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5"><Mic className="h-3 w-3" /> Students without a record</SelectLabel>
              {unlinked.map((s) => (
                <SelectItem key={voiceStudentIdFor(s.email)} value={voiceStudentIdFor(s.email)}>{s.name}</SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
