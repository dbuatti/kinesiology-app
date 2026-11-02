import { ReactNode } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0f0d10] border border-amber-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#0f0d10]/95 backdrop-blur-sm rounded-t-2xl">
          <div>
            <h2 className="text-base font-serif font-bold text-amber-300">Edit Client Intake</h2>
            <p className="text-[10px] text-white/40">Fill out the intake form while sitting with the client.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} className="text-white/50" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-60px)]">
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