
import { BookOpen, Move, ArrowUpDown, RotateCw, Brain, Eye, Link as LinkIcon } from 'lucide-react';
import AppLayout from '@/components/crm/AppLayout';


const CogsLearningPage = () => {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 lg:p-8 max-w-4xl space-y-10">
        <div>

          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight mt-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <Move size={22} />
            </div>
            COGS — Visual Assessment
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Anatomy in Motion · Pelvis, Rib Cage &amp; Cranium coordination</p>
        </div>

        {/* Core Principle */}
        <section className="p-6 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-chart-primary" />
            <h2 className="text-xl font-semibold text-foreground">The COGS Principle</h2>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-base text-foreground leading-relaxed">
              <strong>The pelvis and cranium move in the same direction.</strong><br />
              <strong>The rib cage moves in the opposite direction.</strong>
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Created by Gary Ward (Anatomy in Motion), COGS is a system of looking at human movement through the lens of the pelvis, rib cage, and cranium as interlocking gears that must work together in synchronization. At every step we take — even standing still — these three structures coordinate movement. When they don't, there's disintegration.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            From a functional neurology perspective, <strong>watching someone move is the most accurate way to assess their entire nervous system</strong>. How we stand and walk is mostly organized subconsciously, so we can see organization — or lack of it — in both static posture and dynamic movement.
          </p>
        </section>

        {/* What happens under stress */}
        <section className="p-6 rounded-xl border border-border bg-card space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Eye size={18} className="text-chart-emerald" />
            What to Watch For
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When people get stressed or injured, the body starts to close down and lock down movement capacity, disrupting cog movement. Look for <strong>obvious signs of disintegration</strong> — segments that don't sequence together, joints that stay locked, or over-reliance on one segment for all the movement.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Important:</strong> Your eyes can deceive you. Take this assessment with a grain of salt — it's a marker for improvement and gives you information, but doesn't replace muscle testing. If you're unsure, muscle test the finding.
          </p>
        </section>

        {/* The Three Planes */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">The Three Planes of Assessment</h2>

          {/* Sagittal */}
          <div className="p-5 rounded-xl border border-chart-primary/20 bg-chart-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={18} className="text-chart-primary" />
              <h3 className="text-base font-semibold text-foreground">1. Sagittal Plane — Forward &amp; Backward</h3>
              <span className="text-xs text-muted-foreground">View from the side</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Even though "sagittal" sounds front-to-back, you view it <strong>from the side</strong>. It's anterior-posterior movement: pelvic rotation, thoracic flexion and extension, cervical flexion and extension.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to prompt</span>
                <p className="text-sm text-foreground mt-1">Tilt pelvis forward (bum out), rib cage rounds back, chin tucks. Then scoop pelvis under.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to look for</span>
                <p className="text-sm text-muted-foreground mt-1">Do all three segments sequence? Does the neck automatically tuck when pelvis tips forward? Is there a disconnect?</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 — Isolate</span>
                <p className="text-sm text-muted-foreground mt-1">First test each segment alone: just pelvic tilt, just thoracic flexion/extension, just neck flexion/extension.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 — Integrate</span>
                <p className="text-sm text-muted-foreground mt-1">Now prompt just ONE movement (e.g. round shoulders) and watch if the other two automatically follow.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 italic">
              Example: "Round your shoulders." → Watch for automatic chin tuck and pelvic posterior tilt. If the neck stays extended, there's a sagittal plane cog disconnect.
            </p>
          </div>

          {/* Frontal */}
          <div className="p-5 rounded-xl border border-chart-emerald/20 bg-chart-emerald/5 space-y-3">
            <div className="flex items-center gap-2">
              <Move size={18} className="text-chart-emerald" />
              <h3 className="text-base font-semibold text-foreground">2. Frontal Plane — Side to Side</h3>
              <span className="text-xs text-muted-foreground">View from the front</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Lateral (side-to-side) movement. Assessed front-on. Looking for symmetry and whether lateral flexion through the trunk is accompanied by neck tilt and pelvic shift.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to prompt</span>
                <p className="text-sm text-foreground mt-1">"Bend to your side." Don't tell them what you're looking at.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to look for</span>
                <p className="text-sm text-muted-foreground mt-1">Does the neck naturally tilt? Does the pelvis shift? Or is all movement coming from the thoracic spine only?</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 — Isolate</span>
                <p className="text-sm text-muted-foreground mt-1">Side-bend just the rib cage. Keep the head facing forward. See if they can dissociate.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 — Integrate</span>
                <p className="text-sm text-muted-foreground mt-1">Let the whole body follow the side-bend. Neck tilts, pelvis shifts laterally. Should be automatic.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 italic">
              Common finding: Neck stays rigid and straight during side-bending — indicating the cranium and rib cage are "connected" rather than dissociating properly.
            </p>
          </div>

          {/* Transverse */}
          <div className="p-5 rounded-xl border border-chart-destructive/20 bg-chart-destructive/5 space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw size={18} className="text-chart-destructive" />
              <h3 className="text-base font-semibold text-foreground">3. Transverse Plane — Rotational</h3>
              <span className="text-xs text-muted-foreground">Conceptually viewed from above</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Rotational movement around the vertical axis. Ideally viewed from above. We look for dissociation of segments — can each cog rotate independently?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to prompt</span>
                <p className="text-sm text-foreground mt-1">"Keep your head facing forward. Now rotate just your rib cage right."</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">What to look for</span>
                <p className="text-sm text-muted-foreground mt-1">Can the rib cage rotate independently? Does the head stay facing forward? Does the pelvis stay still?</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 1 — Dissociate</span>
                <p className="text-sm text-muted-foreground mt-1">Rotate rib cage right while pelvis and head stay. Then rotate pelvis left while rib cage and head stay.</p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step 2 — Integrate</span>
                <p className="text-sm text-muted-foreground mt-1">Rib cage rotates right, pelvis rotates left (opposite directions). Head stays facing forward.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 italic">
              Common finding: Upper traps over-firing — movement comes from the shoulders rather than the rib cage. Watch for elbows driving the rotation vs. the rib cage itself.
            </p>
          </div>
        </section>

        {/* Key Takeaways */}
        <section className="p-6 rounded-xl border border-border bg-card space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Key Takeaways</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">1.</span>
              Pelvis and cranium = same direction. Rib cage = opposite. Always.
            </li>
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">2.</span>
              First <strong>isolate</strong> each segment, then <strong>integrate</strong> them together.
            </li>
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">3.</span>
              Don't tell the client what you're looking for — let their subconscious movement patterns reveal themselves.
            </li>
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">4.</span>
              Take visual assessment with a grain of salt. It's a marker for improvement, not a diagnosis.
            </li>
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">5.</span>
              If you're unsure what you're seeing, <strong>muscle test</strong> the finding. The body doesn't lie.
            </li>
            <li className="flex gap-2">
              <span className="text-chart-primary shrink-0">6.</span>
              The brain learns quickly — sometimes just drawing attention to a disconnect starts the integration process.
            </li>
          </ul>
        </section>

        <div className="pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">Based on Anatomy in Motion by Gary Ward · COGS assessment is a preliminary tool, not a diagnostic</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default CogsLearningPage;
