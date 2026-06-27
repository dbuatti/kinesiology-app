
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Save,
  Printer,
  Loader2,
  Heart,
  Eye,
  Brain,
  Wind,
  FileText,
  ChevronLeft,
  Copy,
  Check,
  MessageCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface WhereYourValueBeginsWorksheetProps {
  submissionId?: string | null;
  onBack?: () => void;
}

const BELIEF_OPTIONS = [
  "I'm not worthy",
  "I'm not good enough",
  "I'm not ready yet",
  "Who am I to charge that?",
  "It's selfish to charge",
  "I must be perfect before I begin",
  "I'm responsible for their results",
  "If I don't charge, I can't be blamed",
  "My worth depends on their feedback",
  "I'm afraid of being truly seen",
];

const BODY_LOCATIONS = [
  { id: 'throat', label: 'Throat' },
  { id: 'chest-heart', label: 'Chest / heart' },
  { id: 'solar-plexus', label: 'Solar plexus' },
  { id: 'gut-belly', label: 'Gut / belly' },
  { id: 'pelvis', label: 'Pelvis' },
  { id: 'somewhere-else', label: 'Somewhere else' },
  { id: 'hard-to-locate', label: 'Hard to locate' },
];

const ALLOW_STEPS = [
  'Relax your upper traps and shoulders',
  'Soften your jaw — open it a few millimetres',
  'Relax your eyes',
  'Relax your brain — it\'s a tissue',
  'Gently open your heart, like a flower',
  'Meet whatever\'s there — don\'t name it, just sit with it',
  'If thoughts return, run through again',
  'Receive on the inhale, send it out on the exhale',
];

const AI_PROMPT = `Here are my answers from this worksheet. Please reflect back the strengths and value you can hear in me, gently name any limiting beliefs that might be holding me back from owning my worth, and suggest one small, kind next step. Keep it warm and encouraging.`;

const SectionHeading = ({ number, title, icon: Icon }: { number: string; title: string; icon: any }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Section {number}</span>
      <h3 className="text-xl font-bold text-slate-900 leading-tight">{title}</h3>
    </div>
  </div>
);

const WhereYourValueBeginsWorksheet = ({ submissionId, onBack }: WhereYourValueBeginsWorksheetProps) => {
  const [title, setTitle] = useState('Where Your Value Begins');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(!!submissionId);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(submissionId || null);
  const [copied, setCopied] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval>>();

  const handleSave = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setSaving(true);
    try {
      const payload = {
        user_id: userId,
        title,
        form_data: answers,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (localId) {
        result = await supabase
          .from('value_worksheet_submissions')
          .update(payload)
          .eq('id', localId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('value_worksheet_submissions')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (!localId && result.data) setLocalId(result.data.id);
      if (!silent) toast.success("Progress saved.");
    } catch {
      if (!silent) toast.error("Failed to save.");
    } finally {
      if (!silent) setSaving(false);
    }
  }, [userId, localId, title, answers]);

  useEffect(() => {
    autoSaveTimer.current = setInterval(() => handleSave(true), 60000);
    return () => clearInterval(autoSaveTimer.current);
  }, [handleSave]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (localId) {
          const { data } = await supabase
            .from('value_worksheet_submissions')
            .select('*')
            .eq('id', localId)
            .single();
          if (data) {
            setAnswers(data.form_data || {});
            setTitle(data.title || 'Where Your Value Begins');
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [localId]);

  const set = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const get = (key: string) => answers[key] ?? '';

  const getArr = (key: string): string[] => answers[key] ?? [];

  const toggleArr = (key: string, value: string) => {
    const arr = getArr(key);
    set(key, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const buildAnswersForAI = () => {
    const sections = [
      { heading: 'Section 1: The Number You Flinch At', keys: ['flinched_price', 'flinched_reaction', 'flinched_notice'] },
      { heading: 'Section 2: Name the Belief', keys: ['belief_selected', 'belief_statement'] },
      { heading: 'Section 3: Where It Lives', keys: ['body_location', 'body_sensation'] },
      { heading: 'Section 4: The Allow Process', keys: ['allow_what_shifted', 'allow_belief_now'] },
      { heading: 'Section 5: What You Already Carry', keys: ['carry_life_experience', 'carry_natural', 'carry_problem', 'carry_already_helped', 'carry_readback'] },
      { heading: 'Section 6: Your New Narrative', keys: ['narrative_worthy', 'narrative_not_depend', 'narrative_story'] },
      { heading: 'Final Reflection', keys: ['commitment_step', 'commitment_date'] },
    ];
    let text = '';
    sections.forEach(({ heading, keys }) => {
      text += `\n## ${heading}\n`;
      keys.forEach(key => {
        const val = answers[key];
        if (val) {
          if (Array.isArray(val)) text += `${key}: ${val.join(', ')}\n`;
          else text += `${key}: ${val}\n`;
        }
      });
    });
    return text;
  };

  const copyAllAnswers = async () => {
    const text = buildAnswersForAI();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Answers copied for AI.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 relative">
        <div className="absolute right-0 top-0 flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 border-slate-200 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-2 border-slate-200 rounded-xl">
            <Printer className="w-4 h-4" /> Print
          </Button>
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack} className="flex items-center gap-2 border-slate-200 rounded-xl">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
          <Sparkles size={12} className="text-indigo-500" />
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Neuro Pro Mastery · Value & Self-Worth</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">Where Your Value Begins</h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">A starting point for the earlier-stage practitioner</p>
      </div>

      {/* Epigraph */}
      <div className="text-center px-4">
        <p className="text-lg md:text-xl italic text-indigo-600 font-serif leading-relaxed">
          "Your worth was never measured in years."
        </p>
      </div>

      {/* Intro */}
      <div className="mb-16 space-y-6 text-sm text-slate-600 leading-relaxed">
        <p>
          This is your starting point. Wherever you are — even brand new — you already carry real value.
          This worksheet helps you see it, and gently meet the beliefs that get in the way of owning it.
        </p>
      </div>

      {/* BEFORE YOU BEGIN */}
      <div className="mb-12 p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
        <h2 className="text-sm font-bold text-amber-800">Before You Begin</h2>
        <p className="text-sm text-amber-700 leading-relaxed">
          Your value doesn't wait for experience. The main value workbook leans on years, clinical hours and a long track record. This one is different. It's for where you actually are right now — and it focuses on the part that matters most at every stage: what you believe you're worth, and the beliefs that quietly hold you back.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-white/60 border border-amber-100">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Value you think you need</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Years in practice</li>
              <li>• Thousands of clinical hours</li>
              <li>• A big reputation</li>
              <li>• A full client list</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-white/60 border border-emerald-100">
            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Value you already carry</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Your own self-worth</li>
              <li>• Your life & lived experience</li>
              <li>• Genuine care & presence</li>
              <li>• The problem you help solve</li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-2">
          <p className="text-xs italic text-amber-600/80">"It begins with what you believe you're worth — at any stage."</p>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/40 border border-amber-100 mt-2">
          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Looking honestly at worth can stir up feelings — 'I haven't done enough,' or some discomfort. That's normal, and it's not a verdict on you. Go gently. If something big surfaces, pause and bring it to the group, a 1:1, or the next call — you're not meant to do the deep work alone.
          </p>
        </div>
      </div>

      {/* SECTION 1 */}
      <div className="mb-16">
        <SectionHeading number="1" title="The Number You Flinch At" icon={Eye} />
        <p className="text-sm text-slate-500 mb-6">We'll start where the call started — with the number that makes you hesitate.</p>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              Write the price — a session, package or program — that makes you flinch to say out loud (go a little bigger than feels comfortable):
            </Label>
            <Input
              value={get('flinched_price')}
              onChange={e => set('flinched_price', e.target.value)}
              placeholder="$___"
              className="rounded-xl border-slate-200 text-lg font-bold"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              Now write the first sentence that pops up when you imagine quoting it:
            </Label>
            <Textarea
              value={get('flinched_reaction')}
              onChange={e => set('flinched_reaction', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Notice</Label>
            <p className="text-xs text-slate-500 mb-2">What does that sentence quietly tell you about what's running underneath?</p>
            <Textarea
              value={get('flinched_notice')}
              onChange={e => set('flinched_notice', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
        </div>
      </div>

      {/* SECTION 2 */}
      <div className="mb-16">
        <SectionHeading number="2" title="Name the Belief" icon={Brain} />
        <p className="text-sm text-slate-500 mb-6">These surfaced again and again on the call — beneath nearly every value problem. Tick any that feel familiar. No judgement — just honesty.</p>

        <div className="space-y-3 mb-6">
          {BELIEF_OPTIONS.map(belief => (
            <label key={belief} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <Checkbox
                checked={getArr('belief_selected').includes(belief)}
                onCheckedChange={() => toggleArr('belief_selected', belief)}
                className="mt-0.5 rounded-md"
              />
              <span className="text-sm text-slate-700">{belief}</span>
            </label>
          ))}
        </div>

        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">
            Which one feels most charged or true for you right now? Write it as 'I believe…'
          </Label>
          <Textarea
            value={get('belief_statement')}
            onChange={e => set('belief_statement', e.target.value)}
            className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
            placeholder="I believe..."
          />
        </div>
      </div>



      {/* SECTION 3 */}
      <div className="mb-16">
        <SectionHeading number="3" title="Where It Lives" icon={Heart} />
        <p className="text-sm text-slate-500 mb-6">A belief isn't only a thought — it shows up in the body. Gently, without forcing anything: say that belief to yourself, and notice.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {BODY_LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => set('body_location', get('body_location') === loc.id ? '' : loc.id)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                get('body_location') === loc.id
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {loc.label}
            </button>
          ))}
        </div>

        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">The Sensation</Label>
          <p className="text-xs text-slate-500 mb-2">What's it like? (tight, heavy, fluttery, hollow…) Just describe it — you don't need to change it.</p>
          <Textarea
            value={get('body_sensation')}
            onChange={e => set('body_sensation', e.target.value)}
            className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
            placeholder="..."
          />
        </div>
      </div>



      {/* SECTION 4 */}
      <div className="mb-16">
        <SectionHeading number="4" title="Move Through It — The Allow Process" icon={Wind} />
        <p className="text-sm text-slate-500 mb-6">You already know this. This is how you meet what's there and let it settle — gently. Work down the list slowly.</p>

        <div className="space-y-3 mb-6 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          {ALLOW_STEPS.map(step => (
            <label key={step} className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={getArr('allow_steps_completed').includes(step)}
                onCheckedChange={() => toggleArr('allow_steps_completed', step)}
                className="mt-0.5 rounded-md data-[state=checked]:bg-indigo-500"
              />
              <span className={cn(
                "text-sm",
                getArr('allow_steps_completed').includes(step) ? "text-indigo-600 line-through" : "text-slate-700"
              )}>
                {step}
              </span>
            </label>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <p className="text-xs text-amber-700">
            If strong emotion or memory surfaces, pause — and take it to the group, a 1:1, or the next call.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">What shifted?</Label>
            <p className="text-xs text-slate-500 mb-2">After a pass or two — what changed, even slightly?</p>
            <Textarea
              value={get('allow_what_shifted')}
              onChange={e => set('allow_what_shifted', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              Say the belief again. Does it still feel as true?
            </Label>
            <p className="text-xs text-slate-500 mb-2">Beliefs can be layered — a few gentle passes is normal.</p>
            <Textarea
              value={get('allow_belief_now')}
              onChange={e => set('allow_belief_now', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
        </div>
      </div>



      {/* SECTION 5 */}
      <div className="mb-16">
        <SectionHeading number="5" title="What You Already Carry" icon={Sparkles} />
        <p className="text-sm text-slate-500 mb-6">Now the other side — and most people early on undercount badly. Let's name what's real today.</p>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              What life or lived experience do you bring that no course could teach?
            </Label>
            <Textarea
              value={get('carry_life_experience')}
              onChange={e => set('carry_life_experience', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              What do people naturally come to you for?
            </Label>
            <Textarea
              value={get('carry_natural')}
              onChange={e => set('carry_natural', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              What problem do you genuinely help people with?
            </Label>
            <Textarea
              value={get('carry_problem')}
              onChange={e => set('carry_problem', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              Who have you already helped — even friends, family or practice clients? What changed?
            </Label>
            <Textarea
              value={get('carry_already_helped')}
              onChange={e => set('carry_already_helped', e.target.value)}
              className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
              placeholder="..."
            />
          </div>
        </div>

        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
          <h4 className="text-sm font-bold text-emerald-800 mb-3">Read it back</h4>
          <p className="text-xs text-emerald-600 mb-3">Reading that back — what value do you already carry, today?</p>
          <Textarea
            value={get('carry_readback')}
            onChange={e => set('carry_readback', e.target.value)}
            className="w-full rounded-xl border border-emerald-200 bg-white/80 p-4 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="..."
          />
        </div>
      </div>



      {/* SECTION 6 */}
      <div className="mb-16">
        <SectionHeading number="6" title="Your New Narrative" icon={FileText} />
        <p className="text-sm text-slate-500 mb-6">Like the shift we make on the calls — write the truer story, in your own words.</p>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Complete: 'I am worthy of…'</Label>
            <Textarea
              value={get('narrative_worthy')}
              onChange={e => set('narrative_worthy', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="I am worthy of..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">Complete: 'My worth does not depend on…'</Label>
            <Textarea
              value={get('narrative_not_depend')}
              onChange={e => set('narrative_not_depend', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="My worth does not depend on..."
            />
          </div>
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">My New Narrative</Label>
            <p className="text-xs text-slate-500 mb-2">Write your new story around value and charging.</p>
            <Textarea
              value={get('narrative_story')}
              onChange={e => set('narrative_story', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="..."
            />
          </div>
        </div>
      </div>



      {/* SECTION 7 */}
      <div className="mb-16">
        <SectionHeading number="7" title="A Gentle AI Reflection" icon={MessageCircle} />
        <p className="text-sm text-slate-500 mb-6">Optional — if it helps. Paste your answers into Claude or ChatGPT and ask it to reflect back what it hears.</p>

        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', label: 'Copy your answers', desc: 'Paste all your answers from the previous sections into one block of text, keeping the headings.' },
              { step: '2', label: 'Open your AI assistant', desc: 'Open ChatGPT or Claude, paste your answers, then paste the prompt below underneath them.' },
              { step: '3', label: 'Generate & interrogate', desc: 'Read the output critically. Ask follow-ups and request a conservative and an ambitious figure.' },
            ].map(item => (
              <div key={item.step} className="p-4 rounded-xl bg-white/60 border border-purple-100">
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Step {item.step}</span>
                <h4 className="text-sm font-bold text-slate-800 mt-1 mb-1">{item.label}</h4>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-purple-800">Copy This Prompt</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAllAnswers}
                className="h-7 text-xs rounded-lg"
              >
                {copied ? <Check size={12} className="mr-1 text-emerald-500" /> : <Copy size={12} className="mr-1" />}
                {copied ? 'Copied!' : 'Copy Answers + Prompt'}
              </Button>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
              {AI_PROMPT}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'The value you already carry',
              'Strengths you may discount',
              'Beliefs that may hold you back',
              'A gentler reframe',
              'One small next step',
            ].map(item => (
              <div key={item} className="p-2 rounded-lg bg-white/60 border border-purple-100 text-center">
                <span className="text-[10px] text-purple-600 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* FINAL REFLECTION */}
      <div className="mb-16 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg">
            <Heart size={28} className="text-white" />
          </div>
          <p className="text-xl italic text-indigo-600 font-serif leading-relaxed">
            "Your worth was never about your years. It starts now."
          </p>
          <p className="text-sm text-slate-500">
            You don't need more time in practice to begin valuing yourself. You need to meet what's in the way — gently — and start.
          </p>
        </div>

        <div className="mt-8 space-y-4 text-left">
          <Label className="text-sm font-semibold text-slate-700 block">
            What is one small, kind step you'll take in the next 30 days — toward owning your value, or toward the support you need?
          </Label>
          <Textarea
            value={get('commitment_step')}
            onChange={e => set('commitment_step', e.target.value)}
            className="min-h-[100px] rounded-2xl border-2 border-slate-100 focus:border-indigo-500 p-6 text-base leading-relaxed"
            placeholder="..."
          />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs font-semibold text-slate-500 mb-1 block">Committed to by date</Label>
              <Input
                type="date"
                value={get('commitment_date')}
                onChange={e => set('commitment_date', e.target.value)}
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Footer */}
      <div className="text-center pb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
          <Sparkles size={12} className="text-indigo-500" />
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">Neuro Pro Mastery · Where Your Value Begins</span>
        </div>
        <div className="flex items-center justify-center gap-4 print:hidden">
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
            Save Progress
          </Button>
          {onBack && <Button variant="outline" onClick={onBack} className="rounded-xl">
            <ChevronLeft size={14} className="mr-2" /> Back to Worksheets
          </Button>}
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default WhereYourValueBeginsWorksheet;
