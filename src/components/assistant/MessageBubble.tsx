import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantMessage } from "@/types/assistant";

interface Props {
  message: AssistantMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn(
        "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed",
        isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm",
      )}>
        {message.content}
        {!!message.tool_calls?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
            {message.tool_calls.map((t, i) => (
              <span key={i} className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/70 bg-background/40 rounded-full px-2 py-0.5">
                {t.name.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
