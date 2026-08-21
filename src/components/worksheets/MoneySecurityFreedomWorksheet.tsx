import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy, ArrowLeft, DollarSign, Shield, Zap, TreePine, Target, Heart, Sparkles } from 'lucide-react';

const SECTIONS = [
  { id: 'orientation', label: 'Security vs Freedom', icon: Shield },
  { id: 'family', label: 'Your Family Money Story', icon: Heart },
  { id: 'needs', label: 'The Six Human Needs', icon: Target },
  { id: 'tracker', label: 'Expansion vs Contraction', icon: Zap },
  { id: 'risks', label: 'Risks That Paid Off', icon: Sparkles },
  { id: 'pay-yourself', label: 'Pay Yourself First', icon: DollarSign },
  { id: 'ai', label: 'AI Money-Story Analysis', icon: TreePine },
  { id: 'reflection', label: 'Final Reflection', icon: Check },
];

const RatingRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-3 py-2">
    <span className="flex-1 text-sm font-medium">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
            value === n
              ? 'bg-primary text-primary-foreground scale-110'
              : value > n
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const TextField = ({
  label,
  placeholder,
  value,
  onChange,
  multiline = true,
  rows = 3,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-foreground">{label}</label>
    {multiline ? (
      <textarea
        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
      />
    ) : (
      <input
        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    )}
  </div>
);

const TrackerRow = ({
  index,
  data,
  onChange,
}: {
  index: number;
  data: { decision: string; orientation: string; feeling: string; expansive: string };
  onChange: (d: any) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
    <input
      className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
      placeholder="Decision / Spend"
      value={data.decision}
      onChange={e => onChange({ ...data, decision: e.target.value })}
    />
    <select
      className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
      value={data.orientation}
      onChange={e => onChange({ ...data, orientation: e.target.value })}
    >
      <option value="">Expansion or Contraction?</option>
      <option value="expansion">Expansion</option>
      <option value="contraction">Contraction</option>
    </select>
    <input
      className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
      placeholder="What I was feeling"
      value={data.feeling}
      onChange={e => onChange({ ...data, feeling: e.target.value })}
    />
    <input
      className="rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
      placeholder="The expansive choice"
      value={data.expansive}
      onChange={e => onChange({ ...data, expansive: e.target.value })}
    />
  </div>
);

const NEEDS = ['Certainty / security', 'Variety / uncertainty', 'Significance', 'Love & connection', 'Growth', 'Contribution'];

const MoneySecurityFreedomWorksheet = ({ onBack }: { onBack?: () => void }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    ratings: { decide_freedom: 0, ease_money: 0, smart_risk: 0, enough: 0 },
    decision_source: '',
    decision_example: '',
    small_spends: '',
    money_insecurity: '',
    parents_taught: '',
    emotional_atmosphere: '',
    wealthy_beliefs: '',
    root_belief: '',
    truer_version: '',
    needs_selected: [],
    significance_question: '',
    over_attachment: '',
    tracker: Array.from({ length: 5 }, () => ({ decision: '', orientation: '', feeling: '', expansive: '' })),
    risks_list: '',
    risks_tells_you: '',
    cup_fills: '',
    money_goes: '',
    pay_yourself_this_week: '',
    commitment: '',
    commitment_date: '',
  });

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateNested = useCallback((field: string, sub: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: { ...prev[field], [sub]: value } }));
  }, []);

  const toggleNeed = useCallback((need: string) => {
    setFormData(prev => {
      const current = prev.needs_selected || [];
      const next = current.includes(need) ? current.filter((n: string) => n !== need) : [...current, need];
      return { ...prev, needs_selected: next };
    });
  }, []);

  const updateTracker = useCallback((index: number, data: any) => {
    setFormData(prev => {
      const tracker = [...prev.tracker];
      tracker[index] = data;
      return { ...prev, tracker };
    });
  }, []);

  const handleCopy = useCallback(() => {
    const plain = SECTIONS.map(s => {
      const lines: string[] = [`\n## ${s.label}\n`];
      Object.entries(formData).forEach(([key, val]) => {
        if (key === 'tracker' && Array.isArray(val)) {
          val.forEach((row: any, i: number) => {
            if (row.decision || row.feeling) {
              lines.push(`  ${i + 1}. ${row.decision} | ${row.orientation} | ${row.feeling} | ${row.expansive}`);
            }
          });
        } else if (key === 'ratings' && typeof val === 'object') {
          Object.entries(val).forEach(([k, v]) => {
            if (v) lines.push(`  ${k}: ${v}/10`);
          });
        } else if (key === 'needs_selected' && Array.isArray(val)) {
          lines.push(`  Selected: ${val.join(', ')}`);
        } else if (val && typeof val === 'string' && val.trim()) {
          lines.push(`  ${key}: ${val}`);
        }
      });
      return lines.join('\n');
    }).join('\n');
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [formData]);

  const renderSection = () => {
    switch (activeSection) {
      case 'orientation':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5">
              <h3 className="font-bold text-foreground mb-2">Before You Begin</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Money is neutral — being a good person and being prosperous are not opposites. What shapes your
                wealth isn't your worth; it's the state and the story you run. Your relationship with money
                is a state you bring into the room.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Security · Contraction</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>· Survival thinking</li>
                  <li>· Holding on, gripping</li>
                  <li>· Decisions from fear</li>
                  <li>· Won't risk, won't invest</li>
                </ul>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">Freedom · Expansion</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>· Flow and ease</li>
                  <li>· Operating from surplus</li>
                  <li>· Decisions from overflow</li>
                  <li>· Takes the smart risk</li>
                </ul>
              </div>
            </div>

            <div className="space-y-1 divide-y divide-border/30">
              <RatingRow label="Decide from freedom, not fear" value={formData.ratings.decide_freedom} onChange={v => updateNested('ratings', 'decide_freedom', v)} />
              <RatingRow label="Ease around money" value={formData.ratings.ease_money} onChange={v => updateNested('ratings', 'ease_money', v)} />
              <RatingRow label="Willing to take a smart risk" value={formData.ratings.smart_risk} onChange={v => updateNested('ratings', 'smart_risk', v)} />
              <RatingRow label="I feel 'enough' as I am" value={formData.ratings.enough} onChange={v => updateNested('ratings', 'enough', v)} />
            </div>

            <TextField
              label="Right now, where do most of your money decisions come from — security or freedom? Give one honest example."
              placeholder="e.g. I keep delaying hiring help because I'm scared there won't be enough next month..."
              value={formData.decision_source}
              onChange={v => updateField('decision_source', v)}
            />

            <TextField
              label="Which small spends do you resist, while bigger ones don't make you blink? What does that reveal?"
              placeholder="e.g. I'll hesitate over a $5 coffee but won't think twice about a $500 course..."
              value={formData.small_spends}
              onChange={v => updateField('small_spends', v)}
            />

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-semibold text-primary mb-1">Notice</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Where is money-insecurity quietly bubbling in you — and where might a client feel it?
              </p>
              <textarea
                className="w-full mt-3 rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                rows={3}
                placeholder="Your reflection..."
                value={formData.money_insecurity}
                onChange={e => updateField('money_insecurity', e.target.value)}
              />
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is where the script was first written. Much of what feels like your own money anxiety is inherited —
                which means it's yours to rewrite.
              </p>
            </div>

            <TextField
              label="What did your parents or caregivers teach you about money — directly, and indirectly?"
              placeholder="e.g. Dad worked himself to the bone and never rested. Mum worried about every bill..."
              value={formData.parents_taught}
              onChange={v => updateField('parents_taught', v)}
            />

            <TextField
              label="What was the emotional atmosphere around money growing up — scarcity, stress, ease, abundance?"
              placeholder="Describe the felt sense of money in your childhood home..."
              value={formData.emotional_atmosphere}
              onChange={v => updateField('emotional_atmosphere', v)}
            />

            <TextField
              label="What did your family believe about wealthy people?"
              placeholder="e.g. Rich people are greedy. You have to be ruthless to get ahead..."
              value={formData.wealthy_beliefs}
              onChange={v => updateField('wealthy_beliefs', v)}
            />

            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-3">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">The Root Belief</p>
              <p className="text-xs text-muted-foreground">
                Underneath often sits a belief like 'I am not worthy to receive.' What's yours — and whose is it originally?
              </p>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                rows={2}
                placeholder="e.g. I'm not allowed to have more than my parents did..."
                value={formData.root_belief}
                onChange={e => updateField('root_belief', e.target.value)}
              />
            </div>

            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">A Truer, Kinder Version</p>
              <p className="text-xs text-muted-foreground">
                If someone who loves you heard that belief, how would they reframe it? Write the truer version.
              </p>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                rows={2}
                placeholder="Write the reframe..."
                value={formData.truer_version}
                onChange={e => updateField('truer_version', e.target.value)}
              />
            </div>
          </div>
        );

      case 'needs':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We meet six needs constantly, consciously or not. Tick the one or two your money — and your clinical
                results — are most quietly chasing.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {NEEDS.map(need => (
                <button
                  key={need}
                  onClick={() => toggleNeed(need)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all text-left ${
                    (formData.needs_selected || []).includes(need)
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-background border-border/30 text-muted-foreground hover:border-border/60'
                  }`}
                >
                  {(formData.needs_selected || []).includes(need) && <Check className="h-4 w-4 mb-1" />}
                  {need}
                </button>
              ))}
            </div>

            <TextField
              label="Where are you using money — or clinical results — to feel significant? What would it mean to feel significant without them?"
              placeholder="Your honest reflection..."
              value={formData.significance_question}
              onChange={v => updateField('significance_question', v)}
            />

            <TextField
              label="Is there one thing that meets all four base needs at once? Note any over-attachment."
              placeholder="e.g. The pub, the drink, the chase for results..."
              value={formData.over_attachment}
              onChange={v => updateField('over_attachment', v)}
            />
          </div>
        );

      case 'tracker':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The master key — and it's the nervous-system work you already do, turned on yourself. Track real
                decisions and spends over the coming week.
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Contraction is sympathetic and small; expansion is parasympathetic and sees further.
              </p>
            </div>

            <div className="space-y-3">
              {(formData.tracker || []).map((row: any, i: number) => (
                <TrackerRow key={i} index={i} data={row} onChange={d => updateTracker(i, d)} />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => updateField('tracker', [...(formData.tracker || []), { decision: '', orientation: '', feeling: '', expansive: '' }])}
              className="rounded-xl"
            >
              + Add Row
            </Button>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build the evidence that risk isn't only danger — you already have a track record.
              </p>
            </div>

            <TextField
              label="List the risks across your life that actually paid off — this program, a move, kids, a leap of faith, a purchase that grew you."
              placeholder="1. Starting this business...\n2. Moving cities...\n3. Saying yes to that relationship..."
              value={formData.risks_list}
              onChange={v => updateField('risks_list', v)}
              rows={6}
            />

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <p className="text-sm font-bold text-foreground">What This Tells You</p>
              <p className="text-xs text-muted-foreground">
                Looking at that list, what does it say about your capacity to take the next risk — and what is the next
                one asking to be taken?
              </p>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                rows={3}
                placeholder="Your reflection..."
                value={formData.risks_tells_you}
                onChange={e => updateField('risks_tells_you', e.target.value)}
              />
            </div>
          </div>
        );

      case 'pay-yourself':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You cannot give from an empty cup. Paying yourself first isn't selfish — it's what keeps the cup full
                enough to give from.
              </p>
            </div>

            <TextField
              label="What genuinely fills your cup — health, space, rest, a good meal, learning, time?"
              placeholder="e.g. A morning walk with no phone. Cooking a slow meal. Reading with no purpose..."
              value={formData.cup_fills}
              onChange={v => updateField('cup_fills', v)}
            />

            <TextField
              label="Where does your money go the moment it arrives — and do you come first in that order?"
              placeholder="Be honest about the flow..."
              value={formData.money_goes}
              onChange={v => updateField('money_goes', v)}
            />

            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">This Week</p>
              <p className="text-xs text-muted-foreground">
                One concrete way you'll pay yourself first in the next seven days.
              </p>
              <textarea
                className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                rows={2}
                placeholder="e.g. Transfer $50 to my savings before paying any bills on Monday morning..."
                value={formData.pay_yourself_this_week}
                onChange={e => updateField('pay_yourself_this_week', e.target.value)}
              />
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've mapped your orientation, your story and your patterns. An AI assistant can synthesise it into a
                personal plan in minutes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-semibold">Copy your answers</p>
                  <p className="text-xs text-muted-foreground">Copy all your answers from the previous sections into one block of text, keeping the headings.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-semibold">Open your AI assistant</p>
                  <p className="text-xs text-muted-foreground">Open ChatGPT or Claude, paste your answers, then paste the prompt below underneath them.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm font-semibold">Generate &amp; interrogate</p>
                  <p className="text-xs text-muted-foreground">Read the output critically. Ask follow-ups and request a conservative and an ambitious figure.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
              <p className="text-xs font-bold text-foreground mb-2">PROMPT — Copy this</p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                Based on my answers above, map my current money orientation (security vs freedom) and the
                nervous-system state I carry around money. Draw out the inherited beliefs from my family
                money story that may be limiting me, and offer kinder, truer reframes. Show where I
                default to contraction and how I could choose expansion instead. Suggest small,
                sustainable ways to pay myself first, and 'money tree' ideas — regenerative income I could
                build from the skills and knowledge I already have. Keep it as mindset and practice, not
                financial advice.
              </p>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-bold text-foreground mb-2">What the AI will return</p>
              <div className="grid grid-cols-2 gap-2">
                {['My security/freedom map', 'Inherited beliefs & reframes', 'Contraction patterns', 'Where to choose expansion', 'Ways to fill my cup', 'Money-tree ideas from my skills'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCopy} variant="outline" className="rounded-xl gap-2">
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy All Answers</>}
            </Button>
          </div>
        );

      case 'reflection':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-8 text-center">
              <p className="text-lg font-bold text-foreground mb-1">Money is neutral.</p>
              <p className="text-lg font-bold text-foreground">Freedom is a state you can choose.</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                You move clients from contraction to expansion every day. This is where you do it for yourself.
              </p>
            </div>

            <TextField
              label="What is one belief or practice about money you will consciously change over the next 30 days?"
              placeholder="Write your commitment..."
              value={formData.commitment}
              onChange={v => updateField('commitment', v)}
              rows={4}
            />

            <TextField
              label="Committed to by"
              placeholder="Date"
              value={formData.commitment_date}
              onChange={v => updateField('commitment_date', v)}
              multiline={false}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <DollarSign size={48} className="text-primary/30 mb-4" />
            <p className="text-sm font-semibold text-foreground">Select a section from the left</p>
            <p className="text-xs text-muted-foreground mt-1">Work through each section in order, or jump to any.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/30">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <div className="flex-1">
          <p className="text-xs font-bold text-primary tracking-wider uppercase">Mastery · Personal Health &amp; Mindset</p>
          <h2 className="text-lg font-bold text-foreground">Money, Security &amp; Freedom</h2>
        </div>
        <Button onClick={handleCopy} variant="outline" size="sm" className="rounded-xl gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeSection ? (
          <div className="max-w-2xl mx-auto">
            {renderSection()}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeSection);
                  if (idx > 0) setActiveSection(SECTIONS[idx - 1].id);
                }}
                disabled={SECTIONS[0].id === activeSection}
              >
                ← Previous
              </Button>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeSection);
                  if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
                }}
                disabled={SECTIONS[SECTIONS.length - 1].id === activeSection}
              >
                Next →
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <DollarSign size={48} className="text-primary/30 mb-4" />
            <p className="text-sm font-semibold text-foreground">Select a section from the left</p>
            <p className="text-xs text-muted-foreground mt-1">Work through each section in order, or jump to any.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneySecurityFreedomWorksheet;
