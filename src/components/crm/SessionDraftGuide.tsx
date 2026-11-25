import { ClipboardCopy, ClipboardPaste, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { CLAUDE_PROJECT_INSTRUCTIONS } from "@/lib/session-draft";

/** Set once the practitioner has seen (or dismissed) the guide — after this it
 *  only opens from the session page's More menu. */
export const SESSION_DRAFT_GUIDE_SEEN_KEY = "rk_session_draft_guide_seen";

interface SessionDraftGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: ClipboardCopy,
    step: "Step 1",
    title: "Copy the session context",
    body: "After a session, open the session page and choose More (⋯) → Copy session context. Your clipboard now holds the structured record — goal, findings, corrections logged, BOLT history.",
  },
  {
    icon: Sparkles,
    step: "Step 2",
    title: "Draft with Claude",
    body: "Paste it into your Claude Project together with the session transcript. Claude replies with a SESSION DRAFT block — it should not touch Notion itself. One-time setup: paste the Project instructions — the button below copies them.",
  },
  {
    icon: ClipboardPaste,
    step: "Step 3",
    title: "Import and review",
    body: "Back on the session page: More (⋯) → Import session draft → paste the block. Fields that fill a gap are pre-checked; anything already recorded needs your tick. Applying fills empty Notion properties without touching notes already there.",
  },
] as const;

/**
 * The walkthrough for the Claude-assisted session write-up. Shows once on the
 * first session page visit (per browser), then lives in the More menu.
 */
const SessionDraftGuide = ({ open, onOpenChange }: SessionDraftGuideProps) => {
  const close = (next: boolean) => {
    if (!next) localStorage.setItem(SESSION_DRAFT_GUIDE_SEEN_KEY, "1");
    onOpenChange(next);
  };

  const copyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(CLAUDE_PROJECT_INSTRUCTIONS);
      showSuccess("Claude instructions copied — paste them into your Project's custom instructions.");
    } catch {
      showError("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[560px] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="text-[15px] font-semibold tracking-tight flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            The session draft workflow
          </DialogTitle>
          <DialogDescription className="text-[12px] leading-relaxed">
            Turn a session transcript into the practice record — Claude drafts it, the app stays
            the record, and Notion mirrors the save.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4 space-y-5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-strong dark:text-primary">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    {s.step}
                  </p>
                  <p className="text-[13px] font-semibold text-foreground">{s.title}</p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-border bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
            The record always wins: values already saved are only replaced when you tick them,
            and anything Claude drafted from the transcript stays a draft until you apply it.
            Applying fills empty Notion properties through the existing sync — notes already
            written in Notion are left alone.
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={copyInstructions}
              className="h-9 flex-1 rounded-lg gap-1.5 text-[12px] font-medium"
            >
              <ClipboardCopy size={13} /> Copy Claude instructions
            </Button>
            <Button
              onClick={() => close(false)}
              className="h-9 flex-1 rounded-lg bg-primary text-[12px] font-medium hover:bg-[hsl(var(--primary-hover))]"
            >
              Got it
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/70">
            Reopens anytime from the ⋯ menu — Session draft guide.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDraftGuide;
