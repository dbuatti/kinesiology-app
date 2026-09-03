import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Loader, Copy, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FearCreativityWorksheet = ({ submissionId, onComplete, onBack }) => {
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
          .from('fear_creativity_submissions')
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

  // Self-initialise: auto-load or create this user's row so answers always persist
  useEffect(() => {
    if (!userId || submissionId) return;
    const init = async () => {
      const { data: existing } = await supabase
        .from('fear_creativity_submissions')
        .select('id, form_data, is_released')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        setLocalId(existing.id);
        if (existing.form_data) setFormData(prev => ({ ...prev, ...existing.form_data }));
        setIsCompleted(existing.is_released || false);
      } else {
        const { data: created } = await supabase
          .from('fear_creativity_submissions')
          .insert({ user_id: userId, form_data })
          .select('id')
          .single();
        if (created) setLocalId(created.id);
      }
    };
    init();
  }, [userId, submissionId]);


  useEffect(() => {
    if (!userId || !localId) return;

    const saveData = async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('fear_creativity_submissions')
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
        .from('fear_creativity_submissions')
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
        .from('fear_creativity_submissions')
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
          <h2 className="text-xl font-bold">Fear Creativity Worksheet</h2>
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
            <label className="block text-sm font-medium mb-2">What fear or creative block are you facing?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe the fear or block that's limiting your creativity..."
              value={formData.fear_block || ''}
              onChange={e => handleFieldChange('fear_block', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What is the positive intention behind this fear?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What is this fear trying to protect you from?"
              value={formData.positive_intention || ''}
              onChange={e => handleFieldChange('positive_intention', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">How does this fear limit your creativity?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="In what ways does this fear block your creative expression?"
              value={formData.creativity_limit || ''}
              onChange={e => handleFieldChange('creativity_limit', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What would you create if you weren't afraid?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your creative vision without fear."
              value={formData.creative_vision || ''}
              onChange={e => handleFieldChange('creative_vision', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What is one small creative step you can take?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="A tiny action you can take today toward your vision."
              value={formData.creative_step || ''}
              onChange={e => handleFieldChange('creative_step', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        {!isCompleted && (
          <div className="mt-6">
            <Button onClick={handleComplete} className="w-full">
              Release Fear
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FearCreativityWorksheet;