import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

interface Props {
  clients: ClientOption[];
  value: string | null;
  onChange: (clientId: string | null) => void;
}

const GENERAL_VALUE = "__general__";

export default function ClientPicker({ clients, value, onChange }: Props) {
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
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
