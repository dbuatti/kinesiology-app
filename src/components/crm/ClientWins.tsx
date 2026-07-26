
import { useState, useEffect } from 'react';
import { Heart, Quote, Sparkles, Plus, Loader2, Trash2, History, Save, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Win {
  id: string;
  client_name: string;
  content: string;
  context: string;
  created_at: string;
}

const ClientWins = () => {
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newContext, setNewContext] = useState("Post-session feedback");

  const fetchWins = async () => {
    try {
      const { data, error } = await supabase
        .from('client_wins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWins(data || []);
    } catch (err) {
      console.error("Error fetching wins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWins();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('client_wins')
        .insert({
          user_id: user.id,
          client_name: newName,
          content: newContent,
          context: newContext
        });

      if (error) throw error;

      showSuccess("Win logged to your vault!");
      setNewName("");
      setNewContent("");
      setOpen(false);
      fetchWins();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteTargetId(null);
    try {
      const { error } = await supabase.from('client_wins').delete().eq('id', deleteTargetId);
      if (error) throw error;
      setWins(wins.filter(w => w.id !== deleteTargetId));
      showSuccess("Win removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  return (
    <div className="p-8 bg-card dark:bg-foreground rounded-[2rem] border border-border/50 dark:border-foreground/20 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-serif font-bold flex items-center gap-4 text-foreground dark:text-primary-foreground">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shadow-sm">
            <Heart size={20} className="fill-current" />
          </div>
          Wins Vault
        </h3>
        <Badge variant="outline" className="font-black text-[8px] uppercase tracking-[0.3em] border-destructive/20 text-destructive rounded-full px-4 py-1">
          {wins.length} Captured
        </Badge>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-destructive" /></div>
        ) : wins.length > 0 ? (
          wins.slice(0, 3).map((win) => (
            <div key={win.id} className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 relative group hover:shadow-lg transition-all duration-500">
              <Quote className="absolute top-4 right-4 text-destructive/10 group-hover:text-destructive/20 transition-colors" size={32} />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground shadow-md bg-destructive">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground dark:text-primary-foreground">{win.client_name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{win.context}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-xl text-muted-foreground/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => setDeleteTargetId(win.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground leading-relaxed italic">
                  "{win.content}"
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-muted/50 dark:bg-foreground/50 rounded-2xl border border-dashed border-border dark:border-border">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No wins logged yet.</p>
          </div>
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full py-5 rounded-2xl border-2 border-dashed border-border dark:border-foreground/20 text-muted-foreground hover:border-destructive/30 hover:text-destructive hover:bg-destructive/5 transition-all flex flex-col items-center justify-center gap-2 group">
              <Plus size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log a new win</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10">
            <DialogHeader className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-destructive text-primary-foreground flex items-center justify-center shadow-xl">
                  <Heart size={28} />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-serif font-bold tracking-tight">Capture a Win</DialogTitle>
                  <DialogDescription className="text-base font-medium">Save client feedback or breakthroughs to your vault.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Client Name</label>
                <Input 
                  placeholder="e.g. Susan Lord" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required
                  className="h-12 rounded-xl border-border focus:ring-destructive focus:border-destructive font-bold"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">The "Nice Words"</label>
                <Textarea 
                  placeholder="Paste the feedback here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  required
                  className="min-h-[150px] rounded-2xl border-border focus:ring-destructive focus:border-destructive resize-none p-6 text-lg font-medium leading-relaxed"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Context</label>
                <Input 
                  placeholder="e.g. Post-session text, Email, In-person" 
                  value={newContext} 
                  onChange={e => setNewContext(e.target.value)} 
                  className="h-12 rounded-xl border-border focus:ring-destructive focus:border-destructive font-bold"
                />
              </div>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full h-16 rounded-2xl bg-destructive hover:bg-destructive/90 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-destructive/20 transition-all"
              >
                {saving ? <Loader2 className="animate-spin mr-3" /> : <Save size={20} className="mr-3" />}
                Save to Vault
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {wins.length > 3 && (
          <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/10 group rounded-xl transition-all">
            View All {wins.length} Wins <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}
        title="Remove win?"
        description="This will remove this win from your vault."
        confirmLabel="Remove"
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default ClientWins;