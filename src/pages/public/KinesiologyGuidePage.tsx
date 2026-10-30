import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOKING_URL,
  CONTACT_EMAIL,
  SHOW_PRACTITIONERS_PANEL,
  guideContent,
  type GuideImage,
  type GuidePanel,
} from "@/content/kinesiology-guide";

/* ─────────────────────────────────────────────────────────────────────────
   Small helpers
   ───────────────────────────────────────────────────────────────────────── */

/** Renders copy verbatim, wrapping [square-bracket placeholders] in a mark. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[[^\]]+\]$/.test(part) ? (
          <mark
            key={i}
            className="rounded-[3px] bg-amber-100 px-1 py-0.5 font-normal text-amber-950 ring-1 ring-amber-300/70 dark:bg-amber-400/20 dark:text-amber-100 dark:ring-amber-300/40"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/** A photo slot: the real image if `src` is set, otherwise a labelled box. */
function ImageSlot({ image, className }: { image: GuideImage; className?: string }) {
  const ratio = image.aspect === "3/2" ? "aspect-[3/2]" : "aspect-[4/5]";

  if (image.src) {
    return (
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        className={cn("w-full rounded-lg border border-border object-cover", ratio, className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={image.alt}
      className={cn(
        "flex w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40",
        ratio,
        className
      )}
    >
      <span aria-hidden="true" className="px-4 text-center text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
        {image.label}
      </span>
    </div>
  );
}

/** The single call to action, repeated twice. */
function GuideCta({ label }: { label: string }) {
  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="guide-cta group inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-normal text-ground shadow-[0_8px_24px_-12px_var(--dawn-ink)] transition-[filter,box-shadow] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--dawn-rose)]/40 dark:text-ground"
    >
      {label}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Panels
   ───────────────────────────────────────────────────────────────────────── */

function PanelShell({
  id,
  heading,
  children,
  tone = "plain",
  index,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
  tone?: "plain" | "brand";
  index?: number;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn(
        "guide-panel border-t border-border/70",
        tone === "brand" && "bg-brand/[0.045]"
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-28">
        {index !== undefined && (
          <p
            className="guide-reveal text-[12px] uppercase tracking-widest text-brand/60 mb-3"
          >
            {String(index + 1).padStart(2, "0")}
          </p>
        )}
        <h2
          id={`${id}-heading`}
          className="guide-reveal max-w-[65ch] font-serif text-[32px] font-light leading-[1.1] tracking-[-0.02em] text-brand sm:text-[40px]"
        >
          {heading}
        </h2>
        {children}
      </div>
    </section>
  );
}

function SequencePanel({ panel, index }: { panel: Extract<GuidePanel, { kind: "sequence" }>; index?: number; }) {
  return (
    <PanelShell id={panel.id} heading={panel.heading} index={index}>
      {panel.intro && (
        <p className="guide-reveal mt-5 max-w-[65ch] text-[18px] leading-[1.6] text-muted-foreground">
          <RichText text={panel.intro} />
        </p>
      )}

      <ol className="mt-12 grid gap-7 min-[900px]:grid-cols-5 min-[900px]:gap-5">
        {panel.stages.map((stage, index) => {
          const isLast = index === panel.stages.length - 1;
          return (
            <li key={`${stage.letter}-${index}`} className="guide-reveal relative flex gap-4 min-[900px]:flex-col min-[900px]:gap-4">
              {/* Connector — vertical on phones, horizontal at 900px+ */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-5 top-12 h-[calc(100%-1.25rem)] w-px bg-border min-[900px]:left-10 min-[900px]:right-[-1.25rem] min-[900px]:top-5 min-[900px]:h-px min-[900px]:w-auto"
                />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-card font-serif text-[17px] text-brand">
                {stage.letter}
              </span>
              <div className="min-w-0">
                <h3 className="text-[18px] font-semibold text-foreground">{stage.name}</h3>
                <p className="mt-1.5 text-[17px] leading-[1.55] text-muted-foreground min-[900px]:text-[16px]">
                  <RichText text={stage.sentence} />
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </PanelShell>
  );
}

function FactsPanel({
  panel,
  ctaLabel,
}: {
  panel: Extract<GuidePanel, { kind: "facts" }>;
  ctaLabel: string;
}) {
  return (
    <PanelShell id={panel.id} heading={panel.heading}>
      <dl className="mt-8 max-w-[65ch] divide-y divide-border border-y border-border">
        {panel.facts.map((fact) => (
          <div key={fact.label} className="guide-reveal grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
            <dt className="text-[15px] text-muted-foreground">{fact.label}</dt>
            <dd className="text-[18px] leading-[1.6] text-foreground">
              <RichText text={fact.value} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="guide-reveal mt-10 flex flex-col items-start gap-5">
        <div className="guide-noprint">
          <GuideCta label={ctaLabel} />
        </div>
        <p className="text-[16px] text-foreground">
          {panel.emailPrompt}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="rounded-[3px] underline decoration-muted-foreground/50 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
        {/* Visible in print so the link isn't lost on paper. */}
        <p className="guide-print-only text-[13px] leading-relaxed text-foreground">
          Booking: {BOOKING_URL}
        </p>
      </div>
    </PanelShell>
  );
}

function TextPanel({
  panel,
  image,
  index,
}: {
  panel: Extract<GuidePanel, { kind: "text" }>;
  image?: GuideImage;
}) {
  const isDifferentiator = panel.weight === "differentiator";
  const hasImage = Boolean(image);

  const body = (
    <div className={cn("min-w-0", !hasImage && "max-w-[65ch]")}>
      {panel.intro &&
        (isDifferentiator ? (
          <p className="guide-reveal mt-6 font-serif text-[26px] font-light leading-[1.3] tracking-[-0.01em] text-brand sm:text-[32px]">
            <RichText text={panel.intro} />
          </p>
        ) : (
          <p className="guide-reveal mt-5 text-[19px] leading-[1.55] text-foreground">
            <RichText text={panel.intro} />
          </p>
        ))}

      {panel.paragraphs?.map((paragraph, i) => (
        <p
          key={i}
          className={cn(
            "guide-reveal leading-[1.6] text-foreground",
            isDifferentiator ? "text-[20px] sm:text-[22px]" : "text-[18px]",
            (panel.intro || i > 0) && "mt-5"
          )}
        >
          <RichText text={paragraph} />
        </p>
      ))}

      {panel.bullets && (
        <ul
          className={cn(
            "mt-6 list-none",
            isDifferentiator
              ? "mt-10 divide-y divide-brand/15 border-y border-brand/20"
              : "space-y-3"
          )}
        >
          {panel.bullets.map((bullet, i) => (
            <li
              key={i}
              className={cn(
                "guide-reveal text-foreground",
                isDifferentiator
                  ? "grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-1 py-7 sm:grid-cols-[3.5rem_1fr] sm:gap-x-6"
                  : "relative pl-5 text-[18px] leading-[1.6] before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-brand/60"
              )}
            >
              {isDifferentiator && (
                <span
                  aria-hidden="true"
                  className="font-serif text-[24px] leading-[1.1] text-brand/60 sm:text-[30px]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span
                className={cn(
                  isDifferentiator &&
                    "text-[20px] leading-[1.45] tracking-[-0.005em] sm:text-[24px]"
                )}
              >
                <RichText text={bullet} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {panel.closing && (
        <p className="guide-reveal mt-8 max-w-[65ch] text-[18px] leading-[1.6] text-muted-foreground">
          <RichText text={panel.closing} />
        </p>
      )}
    </div>
  );

  if (!hasImage) {
    return (
      <PanelShell id={panel.id} heading={panel.heading} tone={isDifferentiator ? "brand" : "plain"}>
        {body}
      </PanelShell>
    );
  }

  const imageFirst = panel.imageSide === "start";

  return (
    <PanelShell id={panel.id} heading={panel.heading}>
      <div
        className={cn(
          "guide-panel-grid mt-8 grid items-start gap-10 lg:gap-14",
          imageFirst ? "lg:grid-cols-[0.8fr_1.2fr]" : "lg:grid-cols-[1.15fr_0.85fr]"
        )}
      >
        <div className={cn(imageFirst && "lg:order-2")}>{body}</div>
        <figure className={cn("guide-reveal", imageFirst && "lg:order-1")}>
          <ImageSlot
            image={image!}
            className={
              image!.aspect === "4/5" ? "max-w-[320px] sm:max-w-[400px] lg:max-w-none" : undefined
            }
          />
          <figcaption className="sr-only">{image!.alt}</figcaption>
        </figure>
      </div>
    </PanelShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────────────────── */

export default function KinesiologyGuidePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { meta, cover, panels, images, practitioners, footer, ctaLabel } = guideContent;

  /* Head: title, description, robots, social cards. */
  useEffect(() => {
    const previousTitle = document.title;
    document.title = meta.title;

    type Restore = () => void;
    const restores: Restore[] = [];

    const setMeta = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      const created = !el;
      const previous = el?.getAttribute("content") ?? null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      restores.push(() => {
        if (created) el?.remove();
        else if (previous !== null) el?.setAttribute("content", previous);
      });
    };

    setMeta("name", "description", meta.description);
    setMeta("name", "robots", "noindex, follow");
    setMeta("property", "og:type", "article");
    setMeta("property", "og:title", cover.headline);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:image", meta.ogImage);
    setMeta("property", "og:image:width", String(meta.ogImageWidth));
    setMeta("property", "og:image:height", String(meta.ogImageHeight));
    setMeta("property", "og:image:alt", meta.ogImageAlt);
    setMeta("property", "og:url", "https://kinesiology.danielebuatti.com/guide");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", cover.headline);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", meta.ogImage);
    setMeta("name", "twitter:image:alt", meta.ogImageAlt);

    return () => {
      restores.forEach((restore) => restore());
      document.title = previousTitle;
    };
  }, [meta, cover.headline]);

  /* Thin scroll-progress bar. */
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = progressRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = `${ratio * 100}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* Subtle one-time reveal. Skipped under prefers-reduced-motion; with JS
     disabled nothing is hidden because data-motion is never set. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.setAttribute("data-motion", "on");
    const items = Array.from(root.querySelectorAll<HTMLElement>(".guide-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
    };
  }, []);

  return (
    <div ref={rootRef} className="landing guide relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Scroll progress — not announced, not printed. */}
      <div aria-hidden="true" className="guide-progress guide-noprint">
        <div ref={progressRef} className="guide-progress__fill" />
      </div>

      <main>
        {/* Panel 1 — cover */}
        <section
          aria-labelledby="cover-heading"
          className="guide-cover relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-background"
          style={{
            backgroundImage: "url(/brand/dawn-sky.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#FBF5F0]/0.55 dark:bg-[#1C1D33]/0.75" aria-hidden="true" />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-24">
            <h1
              id="cover-heading"
              className="font-serif text-[42px] font-light leading-[1.04] tracking-[-0.025em] text-ink sm:text-[60px] lg:text-[72px]"
            >
              {cover.headline}
            </h1>
            <p className="mt-7 max-w-[52ch] text-[19px] leading-[1.55] text-ink sm:text-[21px]">
              {cover.subline}
            </p>
            <p className="mt-3 max-w-[52ch] text-[18px] leading-[1.6] text-ink-muted">
              {cover.line}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="guide-scroll-cue absolute bottom-8 left-1/2 mx-auto flex -translate-x-1/2 items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink-muted"
          >
            <span className="h-8 w-8 flex items-center justify-center text-accent">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            {cover.scrollCue}
          </span>
        </section>

        {/* Panels 2–10 */}
        {panels.map((panel, index) => {
          const rendered =
            panel.kind === "sequence" ? (
              <SequencePanel key={panel.id} panel={panel} />
            ) : panel.kind === "facts" ? (
              <FactsPanel key={panel.id} panel={panel} ctaLabel={ctaLabel} />
            ) : (
              <TextPanel
                key={panel.id}
                panel={panel}
                image={panel.imageKey ? images[panel.imageKey] : undefined}
              />
            );

          // One call to action sits immediately after panel 6.
          if (panel.kind === "text" && panel.ctaAfter) {
            return (
              <div key={panel.id}>
                {rendered}
                <div className="guide-cta-strip border-t border-border/70 bg-muted/30">
                  <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
                    <div className="guide-reveal guide-noprint">
                      <GuideCta label={ctaLabel} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Optional practitioners panel after the final panel.
          if (index === panels.length - 1 && SHOW_PRACTITIONERS_PANEL && practitioners) {
            return (
              <div key={panel.id}>
                {rendered}
                <section
                  aria-labelledby="practitioners-heading"
                  className="guide-panel border-t border-border/70 bg-brand/[0.045]"
                >
                  <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
                    <h2
                      id="practitioners-heading"
                      className="guide-reveal max-w-[65ch] font-serif text-[28px] font-light leading-[1.15] tracking-[-0.015em] text-brand sm:text-[34px]"
                    >
                      {practitioners.heading}
                    </h2>
                    <p className="guide-reveal mt-5 max-w-[65ch] text-[18px] leading-[1.6] text-foreground">
                      <RichText text={practitioners.body} />
                    </p>
                  </div>
                </section>
              </div>
            );
          }

          return rendered;
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-[14px] text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <span className="font-serif text-brand">{cover.brandName}</span>
          <span className="sm:ml-auto">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="rounded-[3px] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {CONTACT_EMAIL}
            </a>
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="guide-noprint self-start text-left underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:self-auto"
          >
            {footer.printLabel}
          </button>
        </div>
      </footer>
    </div>
  );
}
