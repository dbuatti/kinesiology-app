import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check, ArrowLeft, Flag, Target, Boxes, Megaphone, Clock, LayoutGrid,
  Calculator, Eye, Loader, Copy, Sparkles, Compass,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SECTIONS = [
  { id: 'where', label: 'Where You Are', icon: Flag },
  { id: 'strategy', label: 'The Strategy Audit', icon: Target },
  { id: 'program', label: 'Your Program', icon: Boxes },
  { id: 'offer', label: 'The Offer, Spoken', icon: Megaphone },
  { id: 'marketing', label: 'Internal vs External', icon: LayoutGrid },
  { id: 'time', label: 'Where the Time Goes', icon: Clock },
  { id: 'digital', label: 'Digital Presence', icon: Eye },
  { id: 'numbers', label: 'Know Your Numbers', icon: Calculator },
  { id: 'costume', label: 'The Costume', icon: Eye },
  { id: 'ai', label: 'AI 90-Day Builder', icon: Sparkles },
  { id: 'reflection', label: 'Final Reflection', icon: Compass },
];

const CHECKBOX_GROUPS: Record<string, { key: string; label: string; group: string }[]> = {
  waiting: [
    { key: 'w_just_find', label: '"People just find me"', group: "SIGNS YOU'RE WAITING" },
    { key: 'w_sessions', label: 'One session, then "shall we book another?"', group: "SIGNS YOU'RE WAITING" },
    { key: 'w_quiet', label: 'Outreach only when it`s quiet', group: "SIGNS YOU'RE WAITING" },
    { key: 'w_website', label: 'Website / logo before first offer', group: "SIGNS YOU'RE WAITING" },
    { key: 'w_course', label: 'Another course before using the last', group: "SIGNS YOU'RE WAITING" },
    { key: 'w_earn', label: 'No idea what last week earned', group: "SIGNS YOU'RE WAITING" },
  ],
  strategy: [
    { key: 'w_icp', label: 'One-sentence ICP you can say aloud', group: "SIGNS YOU HAVE A STRATEGY" },
    { key: 'w_named_program', label: 'A named 6–12 session FNH program', group: "SIGNS YOU HAVE A STRATEGY" },
    { key: 'w_channel', label: 'One channel, worked weekly, for 6–12 months', group: "SIGNS YOU HAVE A STRATEGY" },
    { key: 'w_program_first', label: 'Every new client hears the program first', group: "SIGNS YOU HAVE A STRATEGY" },
    { key: 'w_referral', label: 'Referral partners educated, not asked', group: "SIGNS YOU HAVE A STRATEGY" },
    { key: 'w_numbers', label: 'Numbers tracked every week', group: "SIGNS YOU HAVE A STRATEGY" },
  ],
  audit: [
    { key: 'a_icp', label: 'ICP in one sentence', group: 'Strategy Audit' },
    { key: 'a_program', label: 'A named program (6–12 sessions)', group: 'Strategy Audit' },
    { key: 'a_price', label: 'Price set and said without flinching', group: 'Strategy Audit' },
    { key: 'a_booking', label: 'Online booking system', group: 'Strategy Audit' },
    { key: 'a_payment', label: 'Payment / deposit taken online', group: 'Strategy Audit' },
    { key: 'a_intake', label: 'Intake form (automated)', group: 'Strategy Audit' },
    { key: 'a_gbp', label: 'Google Business Profile (complete)', group: 'Strategy Audit' },
    { key: 'a_website', label: 'Website — even one page', group: 'Strategy Audit' },
    { key: 'a_social', label: 'Social profile that says who I help', group: 'Strategy Audit' },
    { key: 'a_link', label: 'Booking link in bio', group: 'Strategy Audit' },
    { key: 'a_email', label: 'Email list (any size)', group: 'Strategy Audit' },
    { key: 'a_partners', label: '3+ referral partners educated', group: 'Strategy Audit' },
    { key: 'a_reviews', label: '3+ testimonials / reviews', group: 'Strategy Audit' },
    { key: 'a_finder', label: 'FNH Practitioner Finder listing', group: 'Strategy Audit' },
    { key: 'a_weekly', label: 'Weekly numbers tracked', group: 'Strategy Audit' },
    { key: 'a_followup', label: 'Follow-up email after sessions', group: 'Strategy Audit' },
  ],
  program: [
    { key: 'p_name', label: 'Program has a NAME', group: 'Program' },
    { key: 'p_count', label: 'Session count decided (6 / 8 / 12)', group: 'Program' },
    { key: 'p_duration', label: 'Duration decided (weekly / fortnightly)', group: 'Program' },
    { key: 'p_phase1', label: 'Phase 1 — Assess & Ease the System', group: 'Program' },
    { key: 'p_phase2', label: 'Phase 2 — Pathways & Corrections', group: 'Program' },
    { key: 'p_phase3', label: 'Phase 3 — Psych integration & lifestyle', group: 'Program' },
    { key: 'p_price', label: 'Price set (program, not × sessions)', group: 'Program' },
    { key: 'p_plan', label: 'Payment plan option', group: 'Program' },
    { key: 'p_support', label: 'Support between sessions (voice-note / email)', group: 'Program' },
    { key: 'p_followup', label: 'Follow-up email template', group: 'Program' },
    { key: 'p_outcome', label: 'Outcome statement ("a bigger bucket")', group: 'Program' },
    { key: 'p_presentation', label: '60-second spoken presentation', group: 'Program' },
  ],
  marketing: [
    { key: 'm_offer_current', label: 'Program offered to every current client', group: 'INTERNAL' },
    { key: 'm_reactivation', label: 'Past-client reactivation email', group: 'INTERNAL' },
    { key: 'm_followup', label: 'Follow-up email after each session', group: 'INTERNAL' },
    { key: 'm_newsletter', label: 'Newsletter to my list', group: 'INTERNAL' },
    { key: 'm_referral', label: 'Referral education (not asking)', group: 'INTERNAL' },
    { key: 'm_reviews', label: 'Reviews requested at session 3–4', group: 'INTERNAL' },
    { key: 'm_waitlist', label: 'Waiting list / limited slots', group: 'INTERNAL' },
    { key: 'm_gbp', label: 'Google Business Profile posts', group: 'EXTERNAL' },
    { key: 'm_blog', label: 'Blog / GEO articles (AI-search)', group: 'EXTERNAL' },
    { key: 'm_social', label: 'Social: value + journey content', group: 'EXTERNAL' },
    { key: 'm_partners', label: 'Referral partners educated', group: 'EXTERNAL' },
    { key: 'm_lead', label: 'Lead magnet → email list', group: 'EXTERNAL' },
    { key: 'm_finder', label: 'Practitioner Finder listing', group: 'EXTERNAL' },
    { key: 'm_talks', label: 'Local talks / workshops', group: 'EXTERNAL' },
  ],
  digital: [
    { key: 'd_social', label: 'Social profile exists and is active', group: 'Digital' },
    { key: 'd_bio', label: 'Bio says WHO I help + WHAT changes', group: 'Digital' },
    { key: 'd_link', label: 'Booking / discovery-call link in bio', group: 'Digital' },
    { key: 'd_posting', label: 'Posting 2–3× per week', group: 'Digital' },
    { key: 'd_gbp', label: 'Google Business Profile — 100% complete', group: 'Digital' },
    { key: 'd_reviews', label: '10+ Google reviews', group: 'Digital' },
    { key: 'd_website', label: 'Website exists (one page is enough)', group: 'Digital' },
    { key: 'd_hero', label: 'Hero line: "I help ___ go from ___ to ___"', group: 'Digital' },
    { key: 'd_program', label: 'Program on the site — outcome, not features', group: 'Digital' },
    { key: 'd_testimonials', label: 'Testimonials visible', group: 'Digital' },
    { key: 'd_fnh', label: 'FNH represented (site or socials)', group: 'Digital' },
    { key: 'd_name', label: 'Name attached — not hidden behind a brand', group: 'Digital' },
  ],
  costume: [
    { key: 'c_undercharge', label: 'Under-charging "to be affordable"', group: 'Costume' },
    { key: 'c_overgive', label: 'Over-giving / sessions run long', group: 'Costume' },
    { key: 'c_noask', label: '"I don`t want to ask them to come back"', group: 'Costume' },
    { key: 'c_perfect', label: 'Waiting until it`s perfect / ready', group: 'Costume' },
    { key: 'c_study', label: 'Hiding behind study or certifications', group: 'Costume' },
    { key: 'c_brand', label: 'Hiding behind a brand or logo', group: 'Costume' },
    { key: 'c_shiny', label: 'Shiny objects — five half-built streams', group: 'Costume' },
    { key: 'c_desperate', label: 'Posting only when desperate', group: 'Costume' },
    { key: 'c_money', label: 'Freezing around money conversations', group: 'Costume' },
    { key: 'c_imposter', label: 'Imposter: "I don`t know enough"', group: 'Costume' },
    { key: 'c_talked', label: 'Talked myself out of the room / offer', group: 'Costume' },
    { key: 'c_everyone', label: 'Serving everyone = serving no one', group: 'Costume' },
  ],
};

const SECTION_FIELDS: Record<string, { key: string; label: string; full?: boolean; single?: boolean }[]> = {
  where: [
    { key: 'clients_per_week', label: 'Clients per week', single: true },
    { key: 'fee_per_session', label: 'Fee per session ($)', single: true },
    { key: 'weekly_revenue', label: 'Weekly practice revenue ($)', single: true },
    { key: 'hours_dayjob', label: 'Hours/wk — day job + clinic', single: true },
    { key: 'transition_from_to', label: 'What are you transitioning FROM and TO? And by when?' },
    { key: 'clients_sourced', label: 'How many current clients came from something you DID vs simply showed up?' },
    { key: 'goal_12_month', label: 'Your 12-month goal in one line' },
  ],
  strategy: [
    { key: 'strategy_sentence', label: 'YOUR STRATEGY, IN ONE SENTENCE' },
    { key: 'hours_outreach', label: 'Hours/wk actually doing outreach', single: true },
    { key: 'hours_preparing', label: 'Hours/wk "preparing" to (site, study, tweaks)', single: true },
    { key: 'weeks_since_outreach', label: 'Weeks since last consistent outreach', single: true },
  ],
  program: [
    { key: 'program_sessions', label: 'SESSION FOCUS / PHASE' },
    { key: 'program_fnh', label: 'FNH PROCESS' },
    { key: 'program_home', label: 'HOME PRACTICE' },
  ],
  offer: [
    { key: 'offer_script', label: 'HOW DO I WORK WITH YOU?' },
    { key: 'offer_blockers', label: 'What currently stops you presenting this to your NEXT new inquiry?' },
    { key: 'offer_existing', label: 'How would you offer the program to people already booking session-by-session?' },
  ],
  marketing: [
    { key: 'internal_lever', label: 'Which ONE internal lever could bring revenue THIS WEEK?' },
    { key: 'external_channel', label: 'Which ONE external channel will you commit to for the next 6–12 months — and what does "consistent" mean in hours per week?' },
    { key: 'not_channels', label: 'Channels you will deliberately NOT run this year' },
  ],
  time: [
    { key: 'client_hours', label: 'Client hours/wk', single: true },
    { key: 'admin_hours', label: 'Admin hours/wk', single: true },
    { key: 'outreach_hours', label: 'Outreach hours/wk', single: true },
    { key: 'learning_hours', label: 'Learning hours/wk', single: true },
  ],
  digital: [
    { key: 'ten_second', label: 'Open your own profile as a stranger. What do they see in ten seconds — and what`s missing that costs you bookings?' },
    { key: 'name_brand', label: 'Is your NAME on the front of your business, or are you hiding behind a brand?' },
  ],
  numbers: [
    { key: 'gross_monthly', label: 'Gross monthly revenue ($)', single: true },
    { key: 'monthly_expenses', label: 'Monthly expenses ($)', single: true },
    { key: 'net_profit', label: 'Net profit ($)', single: true },
    { key: 'real_hourly', label: 'Real hourly rate ($)', single: true },
    { key: 'current_client_value', label: 'Avg sessions per client now × fee = current client value ($)', single: true },
    { key: 'program_price', label: 'Program price ($)', single: true },
    { key: 'diff_per_client', label: 'Difference per client ($)', single: true },
    { key: 'program_maths', label: 'The program maths: if every new client took your program instead of single sessions, what would the month have earned?' },
    { key: 'price_raise', label: 'When did you last raise your prices — and what would need to be true to raise them now?' },
  ],
  costume: [
    { key: 'belief_working', label: 'What would you have to believe about yourself for your practice to already be working — and does it test true?' },
    { key: 'costume_statement', label: 'THE COSTUME — "My business problem is ___. The belief underneath it is ___. If that belief were gone, this week I would ___."' },
  ],
  reflection: [
    { key: 'strategy_one_line', label: 'Your strategy in one sentence — and the single action you will take THIS WEEK to start it. (Name the action, the day, and who it goes to.)' },
  ],
};

const DIRECTION_OPTIONS = ['Day job + building the practice', 'Part-time, want to scale to fully booked', 'Established but burned out / over-giving', 'Transitioning from another modality into FNH'];
const SPACE_OPTIONS = ['Home clinic / mobile', 'Room in a clinic / rented space'];

const Paragraph = ({ text, accent }: { text: string; accent?: boolean }) => (
  <p className={`text-sm leading-relaxed ${accent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{text}</p>
);

const Card = ({ title, children, tone }: { title?: string; children: React.ReactNode; tone?: 'default' | 'red' | 'green' | 'amber' | 'primary' }) => {
  const tones: Record<string, string> = {
    default: 'bg-primary/5 border-primary/20',
    red: 'bg-red-500/5 border-red-500/20',
    green: 'bg-emerald-500/5 border-emerald-500/20',
    amber: 'bg-amber-500/5 border-amber-500/20',
    primary: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] || tones.default}`}>
      {title && <p className="font-bold text-foreground mb-2">{title}</p>}
      {children}
    </div>
  );
};

const CheckGroup = ({
  items,
  selected,
  onToggle,
}: {
  items: { key: string; label: string; group: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) => {
  const byGroup: Record<string, typeof items> = {};
  items.forEach(i => { (byGroup[i.group] = byGroup[i.group] || []).push(i); });
  return (
    <div className="space-y-4">
      {Object.entries(byGroup).map(([group, list]) => (
        <div key={group}>
          {Object.keys(byGroup).length > 1 && (
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase mb-2">{group}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map(item => {
              const active = selected.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggle(item.key)}
                  className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-background border-border/30 text-muted-foreground hover:border-border/60'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    active ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background'
                  }`}>
                    {active && <Check className="h-3 w-3" />}
                  </span>
                  <span className="leading-snug">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const TextField = ({
  label,
  placeholder,
  value,
  onChange,
  full = false,
  single = false,
  rows = 3,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  single?: boolean;
  rows?: number;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-foreground">{label}</label>
    {single ? (
      <input
        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    ) : (
      <textarea
        className={`w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none ${full ? 'min-h-[120px]' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
      />
    )}
  </div>
);

const SectionBuilder = ({
  fields,
  formData,
  updateField,
  short = false,
}: {
  fields: { key: string; label: string; full?: boolean; single?: boolean }[];
  formData: Record<string, any>;
  updateField: (k: string, v: any) => void;
  short?: boolean;
}) => (
  <div className={short ? 'space-y-4' : 'space-y-5'}>
    {fields.map(f => (
      <TextField
        key={f.key}
        label={f.label}
        value={formData[f.key] || ''}
        onChange={v => updateField(f.key, v)}
        single={f.single}
        full={f.full}
        rows={f.full ? 4 : 3}
      />
    ))}
  </div>
);

const BUSINESS_STRATEGY_DIAGNOSTIC = ({ onBack }: { onBack?: () => void }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [localId, setLocalId] = useState<string | null>(null);
  const autoSaveTimer = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    practitioner: '',
    date: '',
    checklist_waiting: [],
    checklist_strategy: [],
    clients_per_week: '',
    fee_per_session: '',
    weekly_revenue: '',
    hours_dayjob: '',
    direction: '',
    space: '',
    transition_from_to: '',
    clients_sourced: '',
    goal_12_month: '',
    audit: [],
    strategy_sentence: '',
    hours_outreach: '',
    hours_preparing: '',
    weeks_since_outreach: '',
    program_checklist: [],
    program_sessions: '',
    program_fnh: '',
    program_home: '',
    offer_script: '',
    offer_blockers: '',
    offer_existing: '',
    marketing: [],
    internal_lever: '',
    external_channel: '',
    not_channels: '',
    client_hours: '',
    admin_hours: '',
    outreach_hours: '',
    learning_hours: '',
    time_log: Array.from({ length: 5 }, () => ({ day: '', action: '', minutes: '', response: '' })),
    time_log_reflection: '',
    digital: [],
    ten_second: '',
    name_brand: '',
    gross_monthly: '',
    monthly_expenses: '',
    net_profit: '',
    real_hourly: '',
    current_client_value: '',
    program_price: '',
    diff_per_client: '',
    program_maths: '',
    price_raise: '',
    costume: [],
    belief_working: '',
    costume_statement: '',
    ai_answers: '',
    strategy_one_line: '',
    committed_date: '',
  });

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const init = async () => {
      const { data: existing } = await supabase
        .from('business_strategy_diagnostics')
        .select('id, form_data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        setLocalId(existing.id);
        if (existing.form_data) {
          setFormData((prev) => ({ ...prev, ...existing.form_data }));
        }
      } else {
        const { data: created } = await supabase
          .from('business_strategy_diagnostics')
          .insert({ user_id: userId, form_data: formData })
          .select('id')
          .single();
        if (created) setLocalId(created.id);
      }
    };
    init();
  }, [userId]);

  useEffect(() => {
    if (!userId || !localId) return;
    const saveData = async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('business_strategy_diagnostics')
          .upsert({ id: localId, user_id: userId, form_data: formData, updated_at: new Date().toISOString() });
        if (error) throw error;
      } catch (e) {
        console.error('Error saving business strategy diagnostic:', e);
      } finally {
        setIsSaving(false);
      }
    };
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = window.setTimeout(saveData, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [userId, localId, formData]);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleCheck = useCallback((listKey: string, key: string) => {
    setFormData(prev => {
      const current = prev[listKey] || [];
      const next = current.includes(key) ? current.filter((k: string) => k !== key) : [...current, key];
      return { ...prev, [listKey]: next };
    });
  }, []);

  const updateTimeLog = useCallback((index: number, data: any) => {
    setFormData(prev => {
      const t = [...prev.time_log];
      t[index] = { ...t[index], ...data };
      return { ...prev, time_log: t };
    });
  }, []);

  const handleCopy = useCallback(() => {
    const lines: string[] = [];
    const add = (label: string, val?: string) => {
      if (val && typeof val === 'string' && val.trim()) lines.push(`- ${label}: ${val.trim()}`);
      else if (val) lines.push(`- ${label}: ${val}`);
    };
    lines.push('## Business Strategy Diagnostic — Answers');
    add('Practitioner', formData.practitioner);
    add('Date', formData.date);
    if ((formData.checklist_waiting || []).length || (formData.checklist_strategy || []).length) {
      lines.push('- Signs ticked:');
      [...(formData.checklist_waiting || []), ...(formData.checklist_strategy || [])].forEach((k: string) => {
        const found = [...CHECKBOX_GROUPS.waiting, ...CHECKBOX_GROUPS.strategy].find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('Clients per week', formData.clients_per_week);
    add('Fee per session', formData.fee_per_session);
    add('Weekly revenue', formData.weekly_revenue);
    add('Hours/wk day job + clinic', formData.hours_dayjob);
    add('Transition from/to', formData.transition_from_to);
    add('Clients sourced', formData.clients_sourced);
    add('12-month goal', formData.goal_12_month);
    if ((formData.audit || []).length) {
      lines.push('- Strategy audit in place:');
      (formData.audit as string[]).forEach(k => {
        const found = CHECKBOX_GROUPS.audit.find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('Strategy in one sentence', formData.strategy_sentence);
    add('Hours/wk outreach', formData.hours_outreach);
    add('Hours/wk preparing', formData.hours_preparing);
    add('Weeks since outreach', formData.weeks_since_outreach);
    if ((formData.program_checklist || []).length) {
      lines.push('- Program in place:');
      (formData.program_checklist as string[]).forEach(k => {
        const found = CHECKBOX_GROUPS.program.find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('Spoken offer', formData.offer_script);
    add('Offer blockers', formData.offer_blockers);
    add('Offer to existing', formData.offer_existing);
    if ((formData.marketing || []).length) {
      lines.push('- Marketing in place:');
      (formData.marketing as string[]).forEach(k => {
        const found = CHECKBOX_GROUPS.marketing.find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('Internal lever', formData.internal_lever);
    add('External channel', formData.external_channel);
    add('Will NOT run', formData.not_channels);
    add('Client hours/wk', formData.client_hours);
    add('Admin hours/wk', formData.admin_hours);
    add('Outreach hours/wk', formData.outreach_hours);
    add('Learning hours/wk', formData.learning_hours);
    if ((formData.digital || []).length) {
      lines.push('- Digital presence in place:');
      (formData.digital as string[]).forEach(k => {
        const found = CHECKBOX_GROUPS.digital.find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('10-second test', formData.ten_second);
    add('Name vs brand', formData.name_brand);
    add('Gross monthly', formData.gross_monthly);
    add('Monthly expenses', formData.monthly_expenses);
    add('Net profit', formData.net_profit);
    add('Real hourly rate', formData.real_hourly);
    add('Current client value', formData.current_client_value);
    add('Program price', formData.program_price);
    add('Difference per client', formData.diff_per_client);
    add('Program maths', formData.program_maths);
    add('Price raise', formData.price_raise);
    if ((formData.costume || []).length) {
      lines.push('- Costume patterns:');
      (formData.costume as string[]).forEach(k => {
        const found = CHECKBOX_GROUPS.costume.find(i => i.key === k);
        if (found) lines.push(`  • ${found.label}`);
      });
    }
    add('Belief that would make it work', formData.belief_working);
    add('Costume statement', formData.costume_statement);
    add('AI answers', formData.ai_answers);
    add('Strategy + this week`s action', formData.strategy_one_line);
    add('Committed to by', formData.committed_date);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [formData]);

  const renderSection = () => {
    switch (activeSection) {
      case 'where':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <TextField single label="Practitioner" value={formData.practitioner} onChange={v => updateField('practitioner', v)} />
              <TextField single label="Date" value={formData.date} onChange={v => updateField('date', v)} />
            </div>
            <Card tone="primary">
              <Paragraph text="Real numbers, not hoped-for numbers. This is the baseline everything else gets measured against." />
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <TextField single label="Clients per week" value={formData.clients_per_week} onChange={v => updateField('clients_per_week', v)} />
              <TextField single label="Fee per session ($)" value={formData.fee_per_session} onChange={v => updateField('fee_per_session', v)} />
              <TextField single label="Weekly practice revenue ($)" value={formData.weekly_revenue} onChange={v => updateField('weekly_revenue', v)} />
              <TextField single label="Hours/wk — day job + clinic" value={formData.hours_dayjob} onChange={v => updateField('hours_dayjob', v)} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Where you are — choose all that apply, or describe:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DIRECTION_OPTIONS.map(opt => {
                  const active = (formData.direction || '').includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => updateField('direction', active ? '' : opt)}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${active ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-background border-border/30 text-muted-foreground hover:border-border/60'}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Where you work:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SPACE_OPTIONS.map(opt => {
                  const active = (formData.space || '').includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => updateField('space', active ? '' : opt)}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${active ? 'bg-primary/10 border-primary/40 text-foreground' : 'bg-background border-border/30 text-muted-foreground hover:border-border/60'}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextField label="What are you transitioning FROM and TO? (Day job → practice? Kinesiology/massage/other → FNH? Sessions → programs?) And by when?" full value={formData.transition_from_to} onChange={v => updateField('transition_from_to', v)} />
            <TextField label="Of your current clients, how many came from something you DID (a post, an ask, a referral conversation) versus simply showed up?" full value={formData.clients_sourced} onChange={v => updateField('clients_sourced', v)} />
            <TextField label="Your 12-month goal in one line — clients per week, fee or program price, monthly revenue, hours worked:" full value={formData.goal_12_month} onChange={v => updateField('goal_12_month', v)} />
          </div>
        );

      case 'strategy':
        return (
          <div className="space-y-6">
            <Card title="Signs You're Waiting" tone="amber">
              <CheckGroup items={CHECKBOX_GROUPS.waiting} selected={formData.checklist_waiting || []} onToggle={k => toggleCheck('checklist_waiting', k)} />
            </Card>
            <Card title="Signs You Have a Strategy" tone="green">
              <CheckGroup items={CHECKBOX_GROUPS.strategy} selected={formData.checklist_strategy || []} onToggle={k => toggleCheck('checklist_strategy', k)} />
            </Card>
            <Card title="The Strategy Audit — What Actually Exists" tone="primary">
              <Paragraph text="Tick only what is genuinely in place and working today. Not planned. Not half-built. In place." />
              <div className="mt-4">
                <CheckGroup items={CHECKBOX_GROUPS.audit} selected={formData.audit || []} onToggle={k => toggleCheck('audit', k)} />
              </div>
            </Card>
            <TextField label="YOUR STRATEGY, IN ONE SENTENCE" full placeholder='"My clients come from ______ because I consistently ______ every week." If the honest answer is "people just come" — write exactly that.' value={formData.strategy_sentence} onChange={v => updateField('strategy_sentence', v)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField single label="Hours/wk actually doing outreach" value={formData.hours_outreach} onChange={v => updateField('hours_outreach', v)} />
              <TextField single label="Hours/wk 'preparing' to (site, study, tweaks)" value={formData.hours_preparing} onChange={v => updateField('hours_preparing', v)} />
              <TextField single label="Weeks since last consistent outreach" value={formData.weeks_since_outreach} onChange={v => updateField('weeks_since_outreach', v)} />
            </div>
          </div>
        );

      case 'program':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="The FNH approach is built for programs: Ease the System → Pathways & Corrections → Psych Integration & Lifestyle. A signed program is guaranteed revenue and a committed client. Map yours below — even if it's a draft." />
            </Card>
            <CheckGroup items={CHECKBOX_GROUPS.program} selected={formData.program_checklist || []} onToggle={k => toggleCheck('program_checklist', k)} />
            <div className="rounded-2xl border border-border/30 overflow-hidden">
              <div className="grid grid-cols-3 gap-px bg-border/40 text-center text-xs font-bold text-foreground uppercase tracking-wider">
                <div className="bg-muted/40 py-2">Session Focus / Phase</div>
                <div className="bg-muted/40 py-2">FNH Process</div>
                <div className="bg-muted/40 py-2">Home Practice</div>
              </div>
              <div className="grid grid-cols-3 gap-px bg-border/40">
                <textarea className="bg-background p-3 text-sm min-h-[180px] resize-none outline-none focus-visible:bg-background" placeholder="Draft it rough. Sessions 1–2 assessment & Ease the System; 3–6 pathways, cranials, reflexes; then psych & lifestyle." value={formData.program_sessions} onChange={e => updateField('program_sessions', e.target.value)} />
                <textarea className="bg-background p-3 text-sm min-h-[180px] resize-none outline-none" placeholder="FNH process..." value={formData.program_fnh} onChange={e => updateField('program_fnh', e.target.value)} />
                <textarea className="bg-background p-3 text-sm min-h-[180px] resize-none outline-none" placeholder="Home practice..." value={formData.program_home} onChange={e => updateField('program_home', e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 'offer':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="No website needed. The offer exists the moment you can say it. Write it as you'd say it to your next new client." />
            </Card>
            <Card title="HOW DO I WORK WITH YOU?" tone="amber">
              <Paragraph text="For what you're presenting with, I'd recommend [program]: [N] sessions over [duration] — we [outcome]. You also get [support]. It's $[price], upfront or in [N] instalments — which option works best for you?" />
              <textarea rows={4} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.offer_script} onChange={e => updateField('offer_script', e.target.value)} />
            </Card>
            <TextField label="What currently stops you presenting this to your NEXT new inquiry? (Be honest — 'I don't have it built' and 'I don't want to ask' are different answers.)" full value={formData.offer_blockers} onChange={v => updateField('offer_blockers', v)} />
            <Card tone="green">
              <p className="text-sm font-bold text-foreground mb-2">Existing clients</p>
              <Paragraph text="How would you offer the program to people already booking session-by-session? ('For what you're working through, here's what I usually see: we do [N] sessions and reassess.')" />
              <textarea rows={3} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.offer_existing} onChange={e => updateField('offer_existing', e.target.value)} />
            </Card>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="INTERNAL = the people who already know you (current clients, past clients, your list, referrers). EXTERNAL = strangers who don't. Internal is fastest and cheapest. External compounds. Most of you are doing neither consistently." />
            </Card>
            <CheckGroup items={CHECKBOX_GROUPS.marketing} selected={formData.marketing || []} onToggle={k => toggleCheck('marketing', k)} />
            <TextField label="Which ONE internal lever could bring revenue THIS WEEK? (e.g. offer the program to your three most engaged clients; email every past client.)" full value={formData.internal_lever} onChange={v => updateField('internal_lever', v)} />
            <TextField label="Which ONE external channel will you commit to for the next 6–12 months — and what does 'consistent' mean in hours per week?" full value={formData.external_channel} onChange={v => updateField('external_channel', v)} />
            <Card title="THE ONE-STRATEGY RULE" tone="red">
              <Paragraph text="Name the channels you will deliberately NOT run this year. Most practitioners fail by changing strategy before any has had time to work." />
              <textarea rows={3} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.not_channels} onChange={e => updateField('not_channels', e.target.value)} />
            </Card>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="Most people need 3–7 touches before they book. That only happens if outreach is a fixed weekly rhythm, not a mood. Log a real week." />
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <TextField single label="Client hours/wk" value={formData.client_hours} onChange={v => updateField('client_hours', v)} />
              <TextField single label="Admin hours/wk" value={formData.admin_hours} onChange={v => updateField('admin_hours', v)} />
              <TextField single label="Outreach hours/wk" value={formData.outreach_hours} onChange={v => updateField('outreach_hours', v)} />
              <TextField single label="Learning hours/wk" value={formData.learning_hours} onChange={v => updateField('learning_hours', v)} />
            </div>
            <div className="rounded-2xl border border-border/30 overflow-hidden">
              <div className="grid grid-cols-12 gap-px bg-border/40 text-center text-xs font-bold text-foreground uppercase tracking-wider">
                <div className="col-span-2 bg-muted/40 py-2">Day</div>
                <div className="col-span-4 bg-muted/40 py-2">Outreach Action Taken</div>
                <div className="col-span-2 bg-muted/40 py-2">Minutes</div>
                <div className="col-span-4 bg-muted/40 py-2">Result / Response</div>
              </div>
              {(formData.time_log || []).map((row: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-px bg-border/40">
                  <input className="col-span-2 bg-background p-2.5 text-sm outline-none border-0" placeholder="Mon" value={row.day} onChange={e => updateTimeLog(i, { day: e.target.value })} />
                  <input className="col-span-4 bg-background p-2.5 text-sm outline-none border-0" placeholder="Post, email, DM, referral conversation..." value={row.action} onChange={e => updateTimeLog(i, { action: e.target.value })} />
                  <input className="col-span-2 bg-background p-2.5 text-sm outline-none border-0" placeholder="30" value={row.minutes} onChange={e => updateTimeLog(i, { minutes: e.target.value })} />
                  <input className="col-span-4 bg-background p-2.5 text-sm outline-none border-0" placeholder="Response..." value={row.response} onChange={e => updateTimeLog(i, { response: e.target.value })} />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => updateField('time_log', [...(formData.time_log || []), { day: '', action: '', minutes: '', response: '' }])} className="rounded-xl">
              + Add Row
            </Button>
            <TextField label="Looking at the log: is outreach a rhythm or a reaction to a quiet calendar? What would a fixed 2–3 hours a week look like?" full value={formData.time_log_reflection} onChange={v => updateField('time_log_reflection', v)} />
          </div>
        );

      case 'digital':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="A stranger lands on your profile or site. In ten seconds they should know who you help, what changes, and how to start. Audit it as a stranger." />
            </Card>
            <CheckGroup items={CHECKBOX_GROUPS.digital} selected={formData.digital || []} onToggle={k => toggleCheck('digital', k)} />
            <TextField label="Open your own profile as a stranger. What do they see in ten seconds — and what's missing that costs you bookings?" full value={formData.ten_second} onChange={v => updateField('ten_second', v)} />
            <Card tone="amber">
              <Paragraph text="Is your NAME on the front of your business, or are you hiding behind a brand? People buy the person." accent />
              <textarea rows={3} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.name_brand} onChange={e => updateField('name_brand', e.target.value)} />
            </Card>
          </div>
        );

      case 'numbers':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="If you don't know these, you're flying blind. Revenue minus expenses equals profit; profit divided by hours is your real wage." />
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <TextField single label="Gross monthly revenue ($)" value={formData.gross_monthly} onChange={v => updateField('gross_monthly', v)} />
              <TextField single label="Monthly expenses ($)" value={formData.monthly_expenses} onChange={v => updateField('monthly_expenses', v)} />
              <TextField single label="Net profit ($)" value={formData.net_profit} onChange={v => updateField('net_profit', v)} />
              <TextField single label="Real hourly rate ($)" value={formData.real_hourly} onChange={v => updateField('real_hourly', v)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField single label="Avg sessions per client now × fee = current client value ($)" value={formData.current_client_value} onChange={v => updateField('current_client_value', v)} />
              <TextField single label="Program price ($)" value={formData.program_price} onChange={v => updateField('program_price', v)} />
              <TextField single label="Difference per client ($)" value={formData.diff_per_client} onChange={v => updateField('diff_per_client', v)} />
            </div>
            <Card title="THE PROGRAM MATHS" tone="green">
              <Paragraph text="If every new client this month had taken your program instead of single sessions, what would the month have earned? (New clients × program price vs what you actually billed.)" />
              <textarea rows={3} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.program_maths} onChange={e => updateField('program_maths', e.target.value)} />
            </Card>
            <TextField label="When did you last raise your prices — and what would need to be true (fully booked 3 weeks out, waitlist, yes without hesitation) to raise them now?" full value={formData.price_raise} onChange={v => updateField('price_raise', v)} />
          </div>
        );

      case 'costume':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="Every strategy gap has a nervous-system reason. Tick the patterns you recognise, then name the belief. (Take it deeper in 'Where Is the Block?')" />
            </Card>
            <CheckGroup items={CHECKBOX_GROUPS.costume} selected={formData.costume || []} onToggle={k => toggleCheck('costume', k)} />
            <TextField label="What would you have to believe about yourself for your practice to already be working — and does it test true?" full value={formData.belief_working} onChange={v => updateField('belief_working', v)} />
            <Card title="THE COSTUME" tone="red">
              <Paragraph text='"My business problem is ___. The belief underneath it is ___. If that belief were gone, this week I would ___."' />
              <textarea rows={3} className="w-full mt-3 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none" value={formData.costume_statement} onChange={e => updateField('costume_statement', e.target.value)} />
            </Card>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <Card tone="primary">
              <Paragraph text="You've done the honest audit. Paste your answers into ChatGPT or Claude with this prompt. If your answers were thin, it will ask you a few questions first — answer them. You'll come out with a one-page plan that starts with your strategy in one sentence and your first action this week. Bring it to your next 1:1 or Business call, then execute it exactly before changing anything." />
            </Card>
            <div className="space-y-4">
              {[
                ['1', 'Copy your answers', 'Paste all your answers from the previous sections into one block of text, keeping the headings.'],
                ['2', 'Open your AI assistant', 'Open ChatGPT or Claude, paste your answers, then paste the prompt below underneath them.'],
                ['3', 'Generate & interrogate', 'Read the output critically. Ask follow-ups and request a conservative and an ambitious figure.'],
              ].map(([n, t, d]) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{n}</span>
                  <div>
                    <p className="text-sm font-semibold">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Card title="COPY THIS PROMPT" tone="default">
              <p className="text-xs text-muted-foreground leading-relaxed italic whitespace-pre-wrap">
{`You are a direct, practical business mentor. Using my answers above, build my 90-day plan.
FIRST: if any of my answers are vague, missing, or say 'people just come', ask me up to 3
short clarifying questions before you plan — do not guess. THEN give me, in this order:
(1) MY STRATEGY IN ONE SENTENCE: 'My clients come from ___ because I ___ every week.' (2)
MY FIRST ACTION: one thing, this week, with the exact day and who it goes to (e.g.
'Tuesday: offer the program to [client name]'). (3) My path (A/B/C), baseline numbers and
12-month goal. (4) My ICP sentence and a 60-second spoken offer for my 6–12 session FNH
program with price and payment options. (5) ONE internal lever this week and ONE external
channel for 6–12 months, with weekly hours — plus what I will NOT do. (6) A 90-day
checklist from my audit gaps (Month 1 foundation, Month 2 momentum, Month 3 scale), max 5
items each. (7) Program maths: my revenue if every new client takes the program. (8) The
belief most likely to sabotage this, and a weekly check for it. Format as a one-page plan.
Simple, direct, no hype.`}
              </p>
            </Card>
            <TextField label="Your answers to paste (optional — aggregate the sections above here, or paste from the Copy button)" full rows={5} value={formData.ai_answers} onChange={v => updateField('ai_answers', v)} />
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-bold text-foreground mb-2">What the AI will return</p>
              <div className="grid grid-cols-2 gap-2">
                {['Strategy in one sentence', 'First action (day + who)', 'Path · baseline · goal', 'ICP + 60-second spoken offer', 'Lever · channel · NOT list', '90-day checklist', 'Program maths', 'Belief watch + weekly check'].map(item => (
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
            <Card tone="primary">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground mb-1">Waiting is not a strategy.</p>
                <p className="text-lg font-bold text-foreground">Make the offer. Work the channel.</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  The pathway exists. You don't have to figure it out from scratch — you have to follow it, consistently, before you feel ready.
                </p>
              </div>
            </Card>
            <TextField label="Your strategy in one sentence — and the single action you will take THIS WEEK to start it. (Name the action, the day, and who it goes to.)" full rows={4} value={formData.strategy_one_line} onChange={v => updateField('strategy_one_line', v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField single label="Committed to by" value={formData.committed_date} onChange={v => updateField('committed_date', v)} />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Target size={48} className="text-primary/30 mb-4" />
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
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary tracking-wider uppercase">Functional Neuro Health · Mastery · Business</p>
          <h2 className="text-lg font-bold text-foreground">Business Strategy Diagnostic</h2>
        </div>
        {isSaving && <Loader className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Button onClick={handleCopy} variant="outline" size="sm" className="rounded-xl gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Body: section nav + content */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        <nav className="flex gap-2 sm:flex-col sm:gap-1 overflow-x-auto sm:overflow-y-auto border-b sm:border-b-0 sm:border-r border-border/30 p-3 sm:w-56 sm:shrink-0">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors text-left whitespace-nowrap sm:whitespace-normal ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground/70'} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-6 min-w-0">
          {activeSection ? (
            <div className="max-w-3xl mx-auto">
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
              <Target size={48} className="text-primary/30 mb-4" />
              <p className="text-sm font-semibold text-foreground">Select a section from the left</p>
              <p className="text-xs text-muted-foreground mt-1">Work through each section in order, or jump to any.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BUSINESS_STRATEGY_DIAGNOSTIC;
