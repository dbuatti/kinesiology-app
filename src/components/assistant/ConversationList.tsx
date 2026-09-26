import { useMemo, useState } from "react";
import { isToday, isYesterday, differenceInCalendarDays, format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AssistantConversation } from "@/types/assistant";
import { Plus, MessageCircle, Trash2, Search, X } from "lucide-react";

interface Props {
  conversations: AssistantConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  clientNameFor: (clientId: string | null) => string | null;
}

const bucketFor = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (differenceInCalendarDays(new Date(), d) < 7) return "Previous 7 days";
  if (differenceInCalendarDays(new Date(), d) < 30) return "Previous 30 days";
  return "Older";
};

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (differenceInCalendarDays(new Date(), d) < 7) return format(d, "EEE");
  return format(d, "d MMM");
};

/**
 * Conversation history grouped by recency (Today / Yesterday / …) with a
 * quick filter. Client-linked threads show the client's initials so you can
 * find "the one about Bella" at a glance.
 */
export default function ConversationList({ conversations, activeId, onSelect, onNew, onDelete, clientNameFor }: Props) {
  const [query, setQuery] = useState("");
  // A voice student's name is stored directly on the conversation (they aren't in
  // the `clients` table clientNameFor looks up), so prefer that when present.
  const nameFor = (c: AssistantConversation) => c.voice_student_name || clientNameFor(c.client_id);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = conversations
      .filter((c) => !q || `${c.title ?? ""} ${nameFor(c) ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
    const out: { label: string; items: AssistantConversation[] }[] = [];
    for (const c of filtered) {
      const label = bucketFor(c.updated_at || c.created_at);
      const g = out.find((x) => x.label === label);
      g ? g.items.push(c) : out.push({ label, items: [c] });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, query]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="space-y-2 p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        {conversations.length > 4 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter chats"
              className="h-8 w-full rounded-md border border-transparent bg-foreground/[0.04] pl-8 pr-7 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring/40 focus:bg-card md:text-[13px]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="Clear filter">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 px-2 pb-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-2.5 pb-1 pt-1 text-[11px] font-medium text-muted-foreground/80">{g.label}</p>
            <div className="space-y-px">
              {g.items.map((c) => {
                const clientName = nameFor(c);
                const active = activeId === c.id;
                const initials = clientName?.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-card shadow-sm ring-1 ring-border/70" : "hover:bg-foreground/[0.04]"
                    )}
                  >
                    <button onClick={() => onSelect(c.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                      {initials ? (
                        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold", c.voice_student_name ? "bg-chart-destructive/10 text-chart-destructive" : "bg-primary/10 text-primary")}>
                          {initials}
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05] text-muted-foreground">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px]", active ? "font-medium text-foreground" : "text-foreground/85")}>
                          {c.title || "New conversation"}
                        </span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {clientName ? <span className="blur-sensitive">{clientName}</span> : "General"} · {timeLabel(c.updated_at || c.created_at)}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                      className="shrink-0 rounded-md p-1 text-muted-foreground opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {conversations.length === 0 && (
          <EmptyState compact icon={MessageCircle} title="No conversations yet" description="Start one and it’ll show up here." />
        )}
        {conversations.length > 0 && groups.length === 0 && (
          <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">No chats match “{query}”.</p>
        )}
      </ScrollArea>
    </div>
  );
}
