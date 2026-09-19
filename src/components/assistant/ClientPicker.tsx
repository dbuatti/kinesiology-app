import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecentClients } from "@/hooks/use-recent-clients";
import { VoiceStudentOption } from "@/types/assistant";
import { voiceStudentIdFor } from "@/lib/voice-student-id";
import { Users, Mic } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

interface Props {
  clients: ClientOption[];
  voiceStudents: VoiceStudentOption[];
  value: string | null;
  onChange: (clientId: string | null) => void;
}

const GENERAL_VALUE = "__general__";

export default function ClientPicker({ clients, voiceStudents, value, onChange }: Props) {
  const { recentClients } = useRecentClients();
  const recentIds = new Set(recentClients.map((c) => c.id));
  const others = clients.filter((c) => !recentIds.has(c.id));
  // Recent list can outlive the client (renamed/deleted) — only show ones that still resolve.
  const validRecent = recentClients.filter((rc) => clients.some((c) => c.id === rc.id));

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
              {validRecent.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Kinesiology Clients</SelectLabel>
          {others.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectGroup>
        {voiceStudents.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5"><Mic className="h-3 w-3" /> Voice Students</SelectLabel>
              {voiceStudents.map((s) => (
                <SelectItem key={voiceStudentIdFor(s.email)} value={voiceStudentIdFor(s.email)}>{s.name}</SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
