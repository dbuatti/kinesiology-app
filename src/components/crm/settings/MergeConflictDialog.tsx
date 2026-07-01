
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Merge, Loader2, CheckCircle2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MergeConflictDialogProps {
  activeMerge: {
    primary: any;
    duplicate: any;
    fields: Record<string, any>;
  } | null;
  onClose: () => void;
  onFieldsChange: (fields: Record<string, any>) => void;
  onConfirmMerge: () => Promise<void>;
  merging: boolean;
}

const FIELDS_TO_MERGE = [
  'name', 'email', 'phone', 'born', 'suburbs', 'pronouns', 'occupation',
  'marital_status', 'children', 'medical_history', 'medications_supplements',
  'emergency_contact_name', 'emergency_contact_phone', 'referral_source',
  'current_stress_level', 'sleep_quality', 'digestive_health', 'chatgpt_url',
  'journal', 'stripe_customer_id', 'notion_page_id', 'notion_link'
];

const MergeConflictDialog = ({
  activeMerge,
  onClose,
  onFieldsChange,
  onConfirmMerge,
  merging
}: MergeConflictDialogProps) => {
  if (!activeMerge) return null;

  const handleSelectValue = (field: string, value: any) => {
    onFieldsChange({
      ...activeMerge.fields,
      [field]: value
    });
  };

  const handleFieldEdit = (field: string, value: any) => {
    onFieldsChange({
      ...activeMerge.fields,
      [field]: value
    });
  };

  const displayValue = (val: any) => {
    if (val === null || val === undefined || val === "") return <span className="text-slate-300 italic">Empty</span>;
    if (Array.isArray(val)) return val.join(", ");
    if (val instanceof Date) return val.toLocaleDateString();
    return String(val);
  };

  return (
    <Dialog open={!!activeMerge} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="p-10 space-y-6">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl">
                <Merge size={28} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Resolve Merge Conflicts</DialogTitle>
                <DialogDescription className="text-base font-medium">
                  Choose which values to keep for each field. You can also edit the final merged value.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Side-by-side comparison */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/40 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground p-3">
                <div>Field</div>
                <div>Primary (Keep)</div>
                <div>Duplicate (Merge & Delete)</div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[40vh] overflow-y-auto custom-scrollbar">
                {FIELDS_TO_MERGE.map((field) => {
                  const valPrimary = activeMerge.primary[field];
                  const valDuplicate = activeMerge.duplicate[field];
                  
                  const isConflict = String(valPrimary) !== String(valDuplicate) && valPrimary && valDuplicate;

                  return (
                    <div key={field} className={cn(
                      "grid grid-cols-3 p-3 items-center text-xs gap-4",
                      isConflict ? "bg-amber-50/30" : ""
                    )}>
                      <div className="font-bold text-slate-700 capitalize">
                        {field.replace('_', ' ')}
                        {isConflict && <span className="text-amber-500 ml-1">*</span>}
                      </div>
                      
                      {/* Primary Option */}
                      <button
                        type="button"
                        onClick={() => handleSelectValue(field, valPrimary)}
                        className={cn(
                          "p-2 rounded-xl text-left border transition-all",
                          activeMerge.fields[field] === valPrimary
                            ? "border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        )}
                      >
                        {displayValue(valPrimary)}
                      </button>

                      {/* Duplicate Option */}
                      <button
                        type="button"
                        onClick={() => handleSelectValue(field, valDuplicate)}
                        className={cn(
                          "p-2 rounded-xl text-left border transition-all",
                          activeMerge.fields[field] === valDuplicate
                            ? "border-indigo-600 bg-indigo-50/50 font-bold text-indigo-900"
                            : "border-border hover:border-primary/40 text-muted-foreground"
                        )}
                      >
                        {displayValue(valDuplicate)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Edit Area for Merged Fields */}
            <div className="space-y-4 p-5 bg-muted/40 rounded-2xl border border-border">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Edit3 size={14} /> Edit Merged Values
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</Label>
                  <Input
                    value={activeMerge.fields.name || ""}
                    onChange={(e) => handleFieldEdit('name', e.target.value)}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
                  <Input
                    value={activeMerge.fields.email || ""}
                    onChange={(e) => handleFieldEdit('email', e.target.value)}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</Label>
                  <Input
                    value={activeMerge.fields.phone || ""}
                    onChange={(e) => handleFieldEdit('phone', e.target.value)}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suburbs</Label>
                  <Input
                    value={Array.isArray(activeMerge.fields.suburbs) ? activeMerge.fields.suburbs.join(", ") : activeMerge.fields.suburbs || ""}
                    onChange={(e) => handleFieldEdit('suburbs', e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="h-10 rounded-xl bg-white"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medical History</Label>
                  <Textarea
                    value={activeMerge.fields.medical_history || ""}
                    onChange={(e) => handleFieldEdit('medical_history', e.target.value)}
                    className="min-h-[80px] rounded-xl bg-white resize-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Medications & Supplements</Label>
                  <Textarea
                    value={activeMerge.fields.medications_supplements || ""}
                    onChange={(e) => handleFieldEdit('medications_supplements', e.target.value)}
                    className="min-h-[80px] rounded-xl bg-white resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</Button>
              <Button 
                onClick={onConfirmMerge}
                disabled={merging}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20"
              >
                {merging ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />}
                Confirm & Execute Merge
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MergeConflictDialog;