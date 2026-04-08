"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Quote, Sparkles, MessageSquare, Plus, Loader2, Trash2, History, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
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
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-rose-500 fill-rose-500" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Wins Vault</h3>
        </div>
        <Badge variant="outline" className="font-bold text-[10px] border-rose-100 text-rose-600">
          {wins.length} Captured
        </Badge>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>
        ) : wins.length > 0 ? (
          wins.slice(0, 3).map((win) => (
            <Card key={win.id} className="border-none shadow-lg rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all duration-500">
              <CardContent className="p-6 relative">
                <Quote className="absolute top-4 right-6 text-rose-50/50 group-hover:text-rose-100 transition-colors" size={40} />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm bg-rose-500">
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{win.client_name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{win.context}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-xl text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleDelete(win.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                    "{win.content}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-xs font-medium text-slate-400">No wins logged yet.</p>
          </div>
        )}
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full py-4 rounded-[1.5rem] border-2 border-dashed border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50/30 transition-all flex flex-col items-center justify-center gap-1 group">
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Log a new win</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
                  <Heart size={24} />
                </div>
                Capture a Win
              </DialogTitle>
              <DialogDescription className="font-medium">
                Save client feedback or breakthroughs to your vault for future testimonials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                <Input 
                  placeholder="e.g. Susan Lord" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  required
                  className="h-12 rounded-xl border-2 border-slate-100 focus:border-rose-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">The "Nice Words"</label>
                <Textarea 
                  placeholder="Paste the feedback here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  required
                  className="min-h-[120px] rounded-xl border-2 border-slate-100 focus:border-rose-500 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Context</label>
                <Input 
                  placeholder="e.g. Post-session text, Email, In-person" 
                  value={newContext} 
                  onChange={e => setNewContext(e.target.value)} 
                  className="h-12 rounded-xl border-2 border-slate-100 focus:border-rose-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100"
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                Save to Vault
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {wins.length > 3 && (
          <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600">
            View All {wins.length} Wins <History size={14} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClientWins;