"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Plus, Loader2, Trash2, Save, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
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

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this win from your vault?")) return;
    try {
      const { error } = await supabase.from('client_wins').delete().eq('id', id);
      if (error) throw error;
      setWins(wins.filter(w => w.id !== id));
      showSuccess("Win removed.");
    } catch (err) {
      showError("Failed to delete.");
    }
  };

  return (
    <div className="p-8 border border-border bg-background">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-primary">
          <Heart size={18} />
          <h3 className="text-xl font-medium uppercase tracking-tight">Wins Vault</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {wins.length} Captured
        </span>
      </div>

      <div className="space-y-0 border border-border">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : wins.length > 0 ? (
          wins.slice(0, 3).map((win) => (
            <div key={win.id} className="p-6 border-b border-border last:border-b-0 hover:bg-muted transition-colors group relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 border border-border flex items-center justify-center text-primary">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-tight">{win.client_name}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{win.context}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => handleDelete(win.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{win.content}"
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-muted/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No wins logged yet.</p>
          </div>
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full py-6 border-t border-border text-muted-foreground hover:bg-muted hover:text-primary transition-colors flex flex-col items-center justify-center gap-2 group">
              <Plus size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Log a new win</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-8 border border-border">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-xl font-medium uppercase tracking-tight flex items-center gap-3">
                <Heart size={20} className="text-primary" />
                Capture a Win
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client Name</label>
                <Input 
                  placeholder="e.g. Susan Lord" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required
                  className="h-12 border-border focus:ring-primary focus:border-primary rounded-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The "Nice Words"</label>
                <Textarea 
                  placeholder="Paste the feedback here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  required
                  className="min-h-[120px] border-border focus:ring-primary focus:border-primary resize-none rounded-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Context</label>
                <Input 
                  placeholder="e.g. Post-session text, Email, In-person" 
                  value={newContext} 
                  onChange={e => setNewContext(e.target.value)} 
                  className="h-12 border-border focus:ring-primary focus:border-primary rounded-none"
                />
              </div>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full h-14 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest"
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                Save to Vault
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {wins.length > 3 && (
          <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-muted group">
            View All {wins.length} Wins <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClientWins;