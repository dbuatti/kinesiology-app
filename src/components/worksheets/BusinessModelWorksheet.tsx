import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Loader, Copy, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BusinessModelWorksheet = ({ submissionId, onComplete }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const autoSaveTimer = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [localId, setLocalId] = useState<string | null>(submissionId || null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch user ID
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
          .from('business_model_worksheets')
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
        .from('business_model_worksheets')
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
          .from('business_model_worksheets')
          .insert({ user_id: userId, form_data })
          .select('id')
          .single();
        if (created) setLocalId(created.id);
      }
    };
    init();
  }, [userId, submissionId]);

  // Auto-save form data
  useEffect(() => {
    if (!userId || !localId) return;

    const saveData = async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('business_model_worksheets')
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
        .from('business_model_worksheets')
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
        .from('business_model_worksheets')
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
        <h2 className="text-xl font-bold">Business Model Worksheet</h2>
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
            <label className="block text-sm font-medium mb-2">Who is your ideal customer?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe your perfect client in detail."
              value={formData.ideal_customer || ''}
              onChange={e => handleFieldChange('ideal_customer', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What problem do you solve for them?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What specific pain point or desire do you address?"
              value={formData.problem_solved || ''}
              onChange={e => handleFieldChange('problem_solved', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">How do you solve this problem?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What is your unique solution or approach?"
              value={formData.solution || ''}
              onChange={e => handleFieldChange('solution', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What makes you different?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What is your unique value proposition?"
              value={formData.uvp || ''}
              onChange={e => handleFieldChange('uvp', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">How do you make money?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What are your revenue streams?"
              value={formData.revenue_streams || ''}
              onChange={e => handleFieldChange('revenue_streams', e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">What are your key activities?</label>
            <textarea
              className="w-full min-h-[80px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What do you do regularly to deliver your value?"
              value={formData.key_activities || ''}
              onChange={e => handleFieldChange('key_activities', e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        {!isCompleted && (
          <div className="mt-6">
            <Button onClick={handleComplete} className="w-full">
              Complete Worksheet
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BusinessModelWorksheet;