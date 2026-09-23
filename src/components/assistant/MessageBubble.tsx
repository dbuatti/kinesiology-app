import type { ReactNode } from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantMessage } from "@/types/assistant";

interface Props {
  message: AssistantMessage;
}

// Gemini replies use light markdown (**bold**, "* item" bullets) that was
// rendering as literal asterisks. This is a minimal, dependency-free parser for
// just those two things — not a general markdown renderer.
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  // Plain strings don't need (and can't carry) a `key` — only the <strong>
  // elements do. Wrapping non-bold parts in <Fragment key=...> broke this
  // repo's dev tooling, which injects a data-dyad-id prop Fragments reject.
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part,
  );
}

function renderFormatted(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 my-1.5">
        {listBuffer.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ul>,
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^\s*[*-]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }
    flushList();
    if (line.trim() === "") return;
    blocks.push(<p key={`p-${i}`} className="my-1 first:mt-0 last:mb-0">{renderInline(line)}</p>);
  });
  flushList();

  return blocks;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 max-w-[min(86%,42rem)]", isUser ? "ml-auto flex-row-reverse" : "mr-auto")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full animate-in fade-in zoom-in-90 duration-150",
        isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-chart-primary/20 via-chart-primary/10 to-chart-primary/5 text-chart-primary",
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap shadow-sm"
          : "bg-card text-foreground rounded-tl-sm border border-border/70 shadow-sm",
      )}>
        {isUser ? message.content : renderFormatted(message.content || "")}
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
