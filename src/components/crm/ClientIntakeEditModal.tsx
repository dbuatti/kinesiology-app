import { X } from "lucide-react";
import PublicIntakeForm from "./PublicIntakeForm";

interface ClientIntakeEditModalProps {
  clientId: string;
  initialData: Record<string, unknown>;
  onClose: () => void;
  onSave: () => void;
}

export default function ClientIntakeEditModal({
  clientId,
  initialData,
  onClose,
  onSave,
}: ClientIntakeEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="flex w-full max-w-2xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Edit Client Intake</h2>
            <p className="text-[11px] text-muted-foreground">
              Fill out the intake form while sitting with the client.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scroll body — generous gutters so inputs never touch the edge */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          <PublicIntakeForm
            clientId={clientId}
            initialData={initialData as any}
            onSuccess={async () => {
              await onSave();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
