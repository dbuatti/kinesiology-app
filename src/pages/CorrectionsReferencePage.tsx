import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Lightbulb, Check, Search, Trash2, Loader2, Copy, Save, Edit, Brain, Heart, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

const CorrectionsReferencePage = () => {
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [methods, setMethods] = useState<Array<string>>(['cognitive', 'somatic', 'emotional']);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [corrections, setCorrections] = useState<Array<any>>([]);

  useEffect(() => {
    const fetchCorrections = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('corrections')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCorrections(data || []);
      } catch (error) {
        console.error('Error fetching corrections:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCorrections();
  }, []);

  const filteredCorrections = useMemo(() => {
    return corrections
      .filter(correction => {
        const matchesSearch = (correction.title || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
          (correction.description || '')
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesMethod = !selectedMethod || correction.method === selectedMethod;
        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [corrections, search, selectedMethod]);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method === selectedMethod ? null : method);
  };

  const handleSelectCorrection = (correction: any) => {
    setSelectedCorrection(correction);
    setShowForm(false);
    setFormData({});
  };

  const handleShowForm = () => {
    setShowForm(true);
    setSelectedCorrection(null);
    setFormData({
      title: '',
      description: '',
      method: selectedMethod || '',
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('corrections')
        .insert({
          title: formData.title,
          description: formData.description,
          method: formData.method,
        });
      if (error) throw error;
      setShowForm(false);
      const { data } = await supabase
        .from('corrections')
        .select('*')
        .order('created_at', { ascending: false });
      setCorrections(data || []);
    } catch (error) {
      console.error('Error submitting correction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCorrection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this correction?')) return;
    try {
      const { error } = await supabase
        .from('corrections')
        .delete()
        .eq('id', id);
      if (error) throw error;
      const { data } = await supabase
        .from('corrections')
        .select('*')
        .order('created_at', { ascending: false });
      setCorrections(data || []);
    } catch (error) {
      console.error('Error deleting correction:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Corrections Reference</h1>
        <Button onClick={() => setSearch('')} className="btn-ghost">
          <Search className="h-4 w-4" /> Clear Search
        </Button>
      </div>
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Correction Methods</h3>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleMethodSelect('all')}
                className={cn(
                  'px-3 py-1 rounded text-sm',
                  selectedMethod === null ? 'bg-chart-primary/20 text-chart-primary' : 'text-chart-muted hover:bg-chart-muted/50'
                )}
              >
                All
              </Button>
              <Button
                onClick={() => handleMethodSelect('cognitive')}
                className={cn(
                  'px-3 py-1 rounded text-sm',
                  selectedMethod === 'cognitive' ? 'bg-chart-primary/20 text-chart-primary' : 'text-chart-muted hover:bg-chart-muted/50'
                )}
              >
                Cognitive
              </Button>
              <Button
                onClick={() => handleMethodSelect('somatic')}
                className={cn(
                  'px-3 py-1 rounded text-sm',
                  selectedMethod === 'somatic' ? 'bg-chart-primary/20 text-chart-primary' : 'text-chart-muted hover:bg-chart-muted/50'
                )}
              >
                Somatic
              </Button>
              <Button
                onClick={() => handleMethodSelect('emotional')}
                className={cn(
                  'px-3 py-1 rounded text-sm',
                  selectedMethod === 'emotional' ? 'bg-chart-primary/20 text-chart-primary' : 'text-chart-muted hover:bg-chart-muted/50'
                )}
              >
                Emotional
              </Button>
            </div>
          </div>
          <div className="space-y-5">
            <SectionHeader icon={Zap} gradient="bg-gradient-to-r from-indigo-600 to-indigo-500" label="Correction Methods">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map((method) => (
                  <div key={method} className="p-3 border rounded-lg text-center cursor-pointer hover:bg-chart-muted/50 transition-colors" onClick={() => handleMethodSelect(method)}>
                    <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                      {method === 'cognitive' && <Brain className="h-5 w-5" />}
                      {method === 'somatic' && <Zap className="h-5 w-5" />}
                      {method === 'emotional' && <Heart className="h-5 w-5" />}
                    </div>
                    <p className="text-sm font-medium">{method}</p>
                  </div>
                ))}
              </div>
            </SectionHeader>
          </div>
        </div>
        <div className="space-y-5">
          <SectionHeader icon={Lightbulb} gradient="bg-gradient-to-r from-emerald-600 to-emerald-500" label="Clinical Pearls">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCorrections.map((correction) => (
                <div key={correction.id} className="border rounded-lg p-4 hover:bg-chart-muted/50 transition-colors cursor-pointer" onClick={() => handleSelectCorrection(correction)}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-lg bg-chart-primary/20 flex items-center justify-center">
                        <Activity className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{correction.title}</h3>
                      <p className="text-sm text-chart-muted">{correction.description}</p>
                      <div className="mt-2 flex items-center space-x-2 text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px]">{correction.method}</span>
                        <span className="ml-2">{new Date(correction.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCorrections.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <p className="text-chart-muted">No corrections match your search.</p>
                </div>
              )}
            </div>
          </SectionHeader>
        </div>
      </div>
      {selectedCorrection && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{selectedCorrection.title}</h3>
            <div className="flex space-x-2">
              <Button onClick={handleShowForm} variant="outline" className="btn-ghost">
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button onClick={() => handleDeleteCorrection(selectedCorrection.id)} variant="destructive" className="btn-ghost">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
          <p className="mb-4">{selectedCorrection.description}</p>
          <div className="mt-4 p-3 bg-chart-muted rounded-lg">
            <p className="font-medium mb-2">Method:</p>
            <p className="text-chart-muted">{selectedCorrection.method}</p>
          </div>
        </div>
      )}
      {showForm && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">{selectedCorrection ? 'Edit Correction' : 'Add New Correction'}</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleFormChange}
                className="w-full rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter correction title"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleFormChange}
                className="w-full min-h-[96px] rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the correction technique"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Method</label>
              <select
                name="method"
                value={formData.method || ''}
                onChange={handleFormChange}
                className="w-full rounded-border border-input bg-background px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a method</option>
                <option value="cognitive">Cognitive</option>
                <option value="somatic">Somatic</option>
                <option value="emotional">Emotional</option>
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Correction'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CorrectionsReferencePage;