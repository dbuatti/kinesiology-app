import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AssistantConversation } from "@/types/assistant";
import { Plus, MessageCircle } from "lucide-react";

interface Props {
  conversations: AssistantConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  clientNameFor: (clientId: string | null) => string | null;
}

export default function ConversationList({ conversations, activeId, onSelect, onNew, clientNameFor }: Props) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden border-r border-border">
      <div className="p-3">
        <Button onClick={onNew} variant="outline" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2 pb-3">
        <div className="space-y-1">
          {conversations.map((c) => {
            const clientName = clientNameFor(c.client_id);
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeId === c.id ? "bg-muted font-medium" : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 opacity-60" />
                <span className="min-w-0">
                  <span className="block truncate">{c.title || "New conversation"}</span>
                  {clientName && (
                    <span className="block truncate text-[11px] text-chart-primary font-semibold uppercase tracking-wide mt-0.5">
                      {clientName}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No conversations yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
