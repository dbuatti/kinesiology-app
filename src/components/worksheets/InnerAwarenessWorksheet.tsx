import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Loader, Copy, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const InnerAwarenessWorksheet = ({ submissionId, onComplete, onBack }) => {
  const [localId, setLocalId] = useState<string | null>(submissionId || null);
  const autoSaveTimer = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (submissionId && localId === submissionId) {
      const loadSubmission = async () => {
        const { data } = await supabase
          .from('inner_awareness_submissions')
          .select('*')
          .eq('id', submissionId)
          .single();
        if (data) {
          setFormData(data.form_data || {});
          setIsCompleted(data.is_released || false);
        }
      };
      loadSubmission();
    }
  }, [submissionId, localId]);

  useEffect(() => {
    if (!userId || !localId) return;

    const saveData = async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('inner_awareness_submissions')
          .upsert({
            id: localId,
            user_id: userId,
            form_data: formData,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
      } catch (error) {
        console.error('Error saving worksheet:', error);
      } finally {
        setIsSaving(false);
      }
    };

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = window.setTimeout(saveData, 2000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [userId, localId, formData]);

  const handleSave = useCallback(async () => {
    if (!userId || !localId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('inner_awareness_submissions')
        .upsert({
          id: localId,
          user_id: userId,
          form_data: formData,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error saving worksheet:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, localId, formData]);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!userId || !localId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('inner_awareness_submissions')
        .update({
          is_released: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', localId);
      if (error) throw error;
      setIsCompleted(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error completing worksheet:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, localId, onComplete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>Back</Button>
          )}
          <h2 className="text-xl font-bold">Inner Awareness Worksheet</h2>
        </div>
        {isSaving && (
          <Button variant="outline" size="icon" disabled>
            <Loader className="h-4 w-4 animate-spin" />
          </Button>
        )}
        {!isSaving && !isCompleted && (
          <Button onClick={handleSave} className="btn-ghost">
            <Save className="h-4 w-4" /> Save
          </Button>
        )}
        {isCompleted && (
          <Button onClick={handleSave} variant="outline" className="btn-ghost">
            <Check className="h-4 w-4" /> Saved
          </Button>
        )}
      </div>
      <form onSubmit={e => e.preventDefault()}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">What situation triggered your emotional reaction?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the event, conversation, or circumstance that triggered you."
              value={formData.trigger_context || ''}
              onChange={e => handleFieldChange('trigger_context', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What emotions came up for you?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Name the specific emotions you felt (anger, sadness, fear, etc.)."
              value={formData.emotions || ''}
              onChange={e => handleFieldChange('emotions', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Where did you feel these emotions in your body?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the physical sensations (tight chest, clenched jaw, butterflies, etc.)."
              value={formData.body_sensations || ''}
              onChange={e => handleFieldChange('body_sensations', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What story did you tell yourself about this situation?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What meaning did you assign to what happened?"
              value={formData.self_story || ''}
              onChange={e => handleFieldChange('self_story', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What is a more balanced or truthful perspective?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="How might a wise friend view this situation?"
              value={formData.balanced_perspective || ''}
              onChange={e => handleFieldChange('balanced_perspective', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What do you need right now?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What would help you feel more settled or empowered?"
              value={formData.needs || ''}
              onChange={e => handleFieldChange('needs', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        {!isCompleted && (
          <div className="mt-6">
            <Button onClick={handleComplete} className="w-full">
              Gain Clarity
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default InnerAwarenessWorksheet;