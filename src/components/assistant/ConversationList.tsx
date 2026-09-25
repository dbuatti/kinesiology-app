import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AssistantConversation } from "@/types/assistant";
import { Plus, MessageCircle, Trash2 } from "lucide-react";

interface Props {
  conversations: AssistantConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  clientNameFor: (clientId: string | null) => string | null;
}

export default function ConversationList({ conversations, activeId, onSelect, onNew, onDelete, clientNameFor }: Props) {
  // A voice student's name is stored directly on the conversation (they aren't in
  // the `clients` table clientNameFor looks up), so prefer that when present.
  const nameFor = (c: AssistantConversation) => c.voice_student_name || clientNameFor(c.client_id);
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden border-r border-border">
      <div className="p-3">
        <Button onClick={onNew} className="w-full justify-start gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2 pb-3">
        <div className="space-y-1">
          {conversations.map((c) => {
            const clientName = nameFor(c);
            return (
              <div
                key={c.id}
                className={cn(
                  "group relative flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeId === c.id ? "bg-muted font-medium text-foreground" : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-chart-primary transition-opacity",
                    activeId === c.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <button onClick={() => onSelect(c.id)} className="flex items-start gap-2 min-w-0 flex-1 text-left">
                  <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 opacity-60" />
                  <span className="min-w-0">
                    <span className="block truncate">{c.title || "New conversation"}</span>
                    {clientName && (
                      <span className="block truncate text-[11px] text-chart-primary font-semibold mt-0.5">
                        {clientName}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="shrink-0 p-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-chart-destructive transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {conversations.length === 0 && (
            <div className="px-3 py-10 text-center">
              <MessageCircle className="h-5 w-5 mx-auto mb-2 opacity-30" />
              <p className="text-xs text-muted-foreground">No conversations yet.</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Start one and it'll show up here.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
