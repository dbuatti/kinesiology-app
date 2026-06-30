import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Loader, Copy, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Week3Worksheet = ({ submissionId, onComplete }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const autoSaveTimer = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [localId, setLocalId] = useState<string | null>(submissionId || null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch user ID and existing submission
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUserId();
  }, []);

  // Load existing submission if editing
  useEffect(() => {
    if (submissionId && localId === submissionId) {
      const loadSubmission = async () => {
        const { data } = await supabase
          .from('week3_worksheets')
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

  // Auto-save form data
  useEffect(() => {
    if (!userId || !localId) return;

    const saveData = async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('week3_worksheets')
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

    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set new auto-save timer
    autoSaveTimer.current = window.setTimeout(saveData, 2000);

    // Cleanup on unload
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
        .from('week3_worksheets')
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
        .from('week3_worksheets')
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
        <h2 className="text-xl font-bold">Week 3 Worksheet: Releasing Limiting Beliefs</h2>
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
            <label className="block text-sm font-medium mb-2">What limiting belief are you ready to release?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the belief that's holding you back..."
              value={formData.limiting_belief || ''}
              onChange={e => handleFieldChange('limiting_belief', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">How does this belief serve you or protect you?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What positive intention does this belief have?"
              value={formData.protection || ''}
              onChange={e => handleFieldChange('protection', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What is the cost of holding onto this belief?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="How does this belief limit your life?"
              value={formData.cost || ''}
              onChange={e => handleFieldChange('cost', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What would you believe instead?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="State your new empowering belief in the present tense."
              value={formData.new_belief || ''}
              onChange={e => handleFieldChange('new_belief', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What evidence supports your new belief?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="List examples that prove your new belief is true."
              value={formData.evidence || ''}
              onChange={e => handleFieldChange('evidence', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50">
              <input
                type="checkbox"
                checked={formData.action_taken || false}
                onChange={e => handleFieldChange('action_taken', e.target.checked)}
                disabled={isSaving}
                className="h-4 w-4 rounded border-primary bg-transparent checked:bg-primary"
              />
              <span className="ml-2 text-sm">I have taken action based on my new belief</span>
            </label>
          </div>
        </div>
        {!isCompleted && (
          <div className="mt-6">
            <Button onClick={handleComplete} className="w-full">
              Release Belief
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Week3Worksheet;