
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { List, Move, Zap, RefreshCw, Info, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JOINT_ACTION_LIBRARY } from "@/data/joint-action-data";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface JointActionTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JointActionTableModal = ({ open, onOpenChange }: JointActionTableModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] rounded-[2.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-foreground text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
                <List size={28} className="text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Joint Action Reference</DialogTitle>
                <DialogDescription className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
                  Geometry of Movement & Planes of Motion
                </DialogDescription>
              </div>
            </div>
            <Button asChild variant="outline" className="bg-card/10 border-primary-foreground/20 text-primary-foreground hover:bg-card/20 rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest">
              <Link to="/resources/joint-actions/print">
                <Printer size={16} className="mr-2" /> Print Reference
              </Link>
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary font-medium leading-relaxed">
              <strong>Clinical Tip:</strong> To speed up localization, ask the body for the <strong>Plane of Motion</strong> (Sagittal, Frontal, or Transverse) before testing specific actions.
            </p>
          </div>

          <ScrollArea className="h-[50vh] rounded-2xl border border-border/50 shadow-inner">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-left font-black text-muted-foreground text-[10px] uppercase tracking-widest">Joint</th>
                  <th className="p-4 text-left font-black text-primary text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={12} /> Sagittal
                  </th>
                  <th className="p-4 text-left font-black text-emerald-500 text-[10px] uppercase tracking-widest">
                    <Move size={12} className="inline mr-1.5" /> Frontal
                  </th>
                  <th className="p-4 text-left font-black text-orange-500 text-[10px] uppercase tracking-widest">
                    <RefreshCw size={12} className="inline mr-1.5" /> Transverse
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {JOINT_ACTION_LIBRARY.map((joint, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-muted/50/50 transition-colors">
                    <td className="p-4 font-black text-foreground">{joint.name}</td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {joint.actions.Sagittal.map(a => a.label).join(', ')}
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {joint.actions.Frontal.map(a => a.label).join(', ')}
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      {joint.actions.Transverse.map(a => a.label).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JointActionTableModal;