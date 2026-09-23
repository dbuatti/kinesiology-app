import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Loader2, Plus, Trash2, X } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string | null;
  body: string;
}

interface Props {
  clientFirstName: string;
  currentSubject: string;
  currentBody: string;
  onApply: (subject: string, body: string) => void;
}

// Templates use {{client_name}} as a placeholder, replaced with the focused
// client's first name when applied — kept simple (no server-side rendering)
// since this is just a starting point the practitioner always edits before sending.
function fillPlaceholders(text: string, firstName: string) {
  return text.replace(/\{\{\s*client_name\s*\}\}/gi, firstName || "there");
}

export default function EmailTemplatePicker({ clientFirstName, currentSubject, currentBody, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("email_templates").select("id, name, subject, body").order("name");
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setShowSaveForm(false);
    if (next) load();
  };

  const handleApply = (t: EmailTemplate) => {
    onApply(fillPlaceholders(t.subject || "", clientFirstName), fillPlaceholders(t.body, clientFirstName));
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) { showError("Couldn't delete that template."); return; }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveCurrent = async () => {
    if (!newName.trim()) { showError("Give the template a name first."); return; }
    if (!currentBody.trim()) { showError("Write the message before saving it as a template."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const { data, error } = await supabase
        .from("email_templates")
        .insert({ user_id: user.id, name: newName.trim(), subject: currentSubject || null, body: currentBody })
        .select("id, name, subject, body")
        .single();
      if (error) throw error;
      setTemplates((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setShowSaveForm(false);
      showSuccess("Template saved.");
    } catch (err: any) {
      showError(err.message || "Couldn't save the template.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-[11px] gap-1.5">
          <FileText className="h-3 w-3" /> Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="max-h-64 overflow-y-auto p-1">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : templates.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No templates yet — save your current message below.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-center gap-1 rounded-md hover:bg-muted/50 group">
                <button onClick={() => handleApply(t)} className="flex-1 min-w-0 text-left px-3 py-2 text-xs">
                  <div className="font-medium text-foreground truncate">{t.name}</div>
                  {t.subject && <div className="text-muted-foreground truncate mt-0.5">{t.subject}</div>}
                </button>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 shrink-0 mr-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border p-2">
          {showSaveForm ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Template name"
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveCurrent(); }}
              />
              <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveCurrent} disabled={saving}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowSaveForm(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full h-7 text-[11px] gap-1.5 justify-start" onClick={() => setShowSaveForm(true)}>
              <Plus className="h-3 w-3" /> Save current message as template
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
