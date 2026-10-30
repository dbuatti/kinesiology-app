/**
 * /guide — digital brochure copy.
 *
 * All words on the page live here. The page renders this object; edit copy
 * here without touching layout. Square-bracket placeholders are intentionally
 * left visible and are highlighted automatically wherever they appear.
 *
 * DO NOT rewrite, add, or embellish this copy. Do not invent testimonials,
 * statistics, credentials, or health claims.
 */

import { CALCOM_CONFIG, PROFILE_IMAGE_URL } from "@/config/integrations";

/** Real booking URL (used by page CTA and meta). */
export const BOOKING_URL = CALCOM_CONFIG.BOOKING_URL;

/** Shown as a mailto link in panel 10. */
export const CONTACT_EMAIL = "info@danielebuatti.com";

/** Optional practitioners panel — off by default. */
export const SHOW_PRACTITIONERS_PANEL = false;

export interface GuideImage {
  /** Leave empty to render a labelled placeholder box. */
  src: string;
  /** Alt text field — required even while the image is a placeholder. */
  alt: string;
  /** Correct aspect ratio for the slot. */
  aspect: "3/2" | "4/5";
  /** Visible label on the placeholder box. */
  label: string;
}

export interface GuideStage {
  letter: string;
  name: string;
  sentence: string;
}

export interface GuideFact {
  label: string;
  value: string;
}

export interface GuideCover {
  brandName: string;
  headline: string;
  subline: string;
  line: string;
  scrollCue: string;
}

export type GuidePanel =
  | {
      kind: "text";
      id: string;
      heading: string;
      intro?: string;
      paragraphs?: string[];
      bullets?: string[];
      closing?: string;
      /** Which of `images` to show beside this panel. */
      imageKey?: keyof GuideContent["images"];
      /** Which side the photo sits on at desktop width. Defaults to "end". */
      imageSide?: "start" | "end";
      /** Repeat the page's single call to action after this panel. */
      ctaAfter?: boolean;
      weight?: "normal" | "differentiator";
    }
  | {
      kind: "sequence";
      id: string;
      heading: string;
      intro?: string;
      stages: GuideStage[];
    }
  | {
      kind: "facts";
      id: string;
      heading: string;
      facts: GuideFact[];
      emailPrompt: string;
    };

export interface GuideContent {
  meta: {
    title: string;
    description: string;
    ogImage: string;
    ogImageWidth: number;
    ogImageHeight: number;
    ogImageAlt: string;
  };
  cover: GuideCover;
  /** The single call to action, repeated after panel 6 and in panel 10. */
  ctaLabel: string;
  panels: GuidePanel[];
  practitioners?: {
    heading: string;
    body: string;
  };
  images: {
    studio: GuideImage;
    portrait: GuideImage;
  };
  footer: {
    printLabel: string;
  };
}

export const guideContent: GuideContent = {
  meta: {
    title: "Kinesiology guide | Daniele Buatti",
    description:
      "What happens in an FNH kinesiology session with Daniele Buatti in Toorak: the assessment, the hands-on work, written notes after every session, and how long it takes.",
    /** Text-only 1200×630 card in public/og/. Absolute so social crawlers can fetch it. */
    ogImage: "https://kinesiology.danielebuatti.com/og/kinesiology-guide.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: "Kinesiology guide: Some things don't respond to trying harder.",
  },

  cover: {
    brandName: "Resonance Kinesiology",
    headline: "Some things don't respond to trying harder.",
    subline:
      "FNH kinesiology with Daniele Buatti. Hands-on nervous system work in a Toorak studio.",
    line: "A guide to what happens, what you leave with, and how long it takes.",
    scrollCue: "Scroll",
  },

  images: {
    studio: {
      src: "",
      alt: "The Toorak studio room where sessions take place.",
      aspect: "3/2",
      label: "Studio photo — 3:2",
    },
    portrait: {
      src: PROFILE_IMAGE_URL,
      alt: "Portrait of Daniele Buatti.",
      aspect: "4/5",
      label: "Portrait — 4:5",
    },
  },

  panels: [
    {
      kind: "text",
      id: "what-this-is",
      heading: "What this is",
      paragraphs: [
        "FNH stands for Functional Neuro-Health. In practice it means this: I assess how your nervous system is coping, then work with it directly. Breath, balance, reflexes, posture, and the patterns sitting underneath them.",
        "It's kinesiology with a neurological backbone. You lie on a table, fully clothed. We move, we test, we breathe, and sometimes we talk about what comes up.",
      ],
      imageKey: "studio",
    },
    {
      kind: "text",
      id: "who-comes",
      heading: "Who comes to see me",
      intro: "People usually arrive with something specific and physical:",
      bullets: [
        "a jaw that won't unclench, or teeth you grind at night",
        "headaches or migraines that keep coming back",
        "neck and shoulders that massage fixes for about two days",
        "a breath that never quite arrives all the way in",
        "a diagnosis that landed recently and hasn't settled yet",
        "thoughts on a loop that understanding hasn't interrupted",
      ],
      closing:
        "And often something quieter underneath: a long habit of handling everything alone, and a suspicion that it's a bit embarrassing to ask for help this late. It isn't. Almost everyone gets here later than they'd have liked.",
    },
    {
      kind: "sequence",
      id: "how-a-session-runs",
      heading: "How a session runs",
      intro: "Every session follows the same five stages, so you always know where you are.",
      stages: [
        {
          letter: "P",
          name: "Preliminary",
          sentence:
            "We start with what's happened since last time, and what you've walked in carrying.",
        },
        {
          letter: "E",
          name: "Ease",
          sentence:
            "Before anything else, your system settles. Rocking, breath, gentle release around the diaphragm, ribs and collarbone.",
        },
        {
          letter: "A",
          name: "Align",
          sentence: "Assessment. We look at what's actually going on, today.",
        },
        {
          letter: "C",
          name: "Correct",
          sentence: "Hands-on work on what the assessment shows, physical and emotional.",
        },
        {
          letter: "E",
          name: "Embed",
          sentence: "We re-check, settle, and choose one or two things for you to take home.",
        },
      ],
    },
    {
      kind: "text",
      id: "what-i-look-at",
      heading: "What I look at",
      intro: "Not a template. A real assessment, every time.",
      bullets: [
        "Breath. A simple breath-hold score, so there's a number to come back to.",
        "Balance. How you stand, step and walk with your eyes open and closed.",
        "Centre of gravity. How your body organises itself front to back, side to side, and in rotation.",
        "Reflexes. Early-childhood reflexes that can switch back on under long-term stress.",
        "Nerve function. Quick checks of the nerves running eyes, face, jaw and throat.",
        "Muscle monitoring. Gentle muscle tests that show where your system is holding stress, and which organ and meridian systems are involved.",
      ],
    },
    {
      kind: "text",
      id: "what-you-leave-with",
      heading: "What you leave with",
      intro: "This is the part most people don't expect.",
      bullets: [
        "Written notes after every session, by email, in plain language. What we found, what we did, what it might mean.",
        "One or two small practices. Not a program. Two things you'll actually do.",
        "Numbers we track over time, so progress isn't only a feeling.",
        "A thread that carries forward. I keep detailed records, so each session starts from where the last one left off. You never have to re-explain.",
      ],
      weight: "differentiator",
      ctaAfter: true,
    },
    {
      kind: "text",
      id: "how-long",
      heading: "How long this takes",
      paragraphs: [
        "Not one session. The first is mostly orientation, and it's longer on conversation than people expect. Things tend to start moving around the third or fourth. The sessions after that are where anything lasting happens.",
        "If you tend to stop things around week five, tell me at the start. We'll build something in for it. It's a common pattern, not a character flaw.",
      ],
    },
    {
      kind: "text",
      id: "what-this-isnt",
      heading: "What this isn't",
      bullets: [
        "Not a replacement for medical or psychological care. It works alongside them, and I'd rather you have both.",
        "Not a diagnosis.",
        "Not a massage.",
        "Not a one-session fix.",
      ],
    },
    {
      kind: "text",
      id: "about-me",
      heading: "About me",
      paragraphs: [
        "I'm Daniele. I hold a Diploma of Kinesiology [MY DIPLOMA WORDING] and work within the Functional Neuro-Health framework [MY WORDING].",
        "I also spend much of my week as a music director and vocal coach. That's less of a detour than it sounds. Both jobs are about what a body does under pressure, and how much of that is old habit rather than fact.",
        "The voice, and the body it lives in.",
      ],
      imageKey: "portrait",
      imageSide: "start",
    },
    {
      kind: "facts",
      id: "practical-bits",
      heading: "The practical bits",
      facts: [
        { label: "Where", value: 'Toorak studio (address on booking)' },
        { label: "How long", value: "60 minutes" },
        { label: "Cost", value: "$180 per session" },
        { label: "What to wear", value: "something you can move in. Everything stays on." },
        { label: "Cancellations", value: "24 hours' notice required; cancellations with less than 24 hours' notice are charged the full session fee." },
        { label: "Booking", value: "online, no account needed" },
      ],
      emailPrompt: "Questions first? ",
    },
  ],

  ctaLabel: "Book a first session",

  practitioners: {
    heading: "For GPs, psychologists and other practitioners",
    body: "Some of my clients come to me while under medical or psychological care, and I work alongside that care. I don't diagnose or treat medical conditions. With your client's consent, I'm glad to share session summaries. [Contact line]",
  },

  footer: {
    printLabel: "Save as PDF",
  },
};

/** Every square-bracket placeholder still unfilled, de-duplicated, in order. */
function collectPlaceholders(value: unknown, found: string[]): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(/\[[^\]]+\]/g)) {
      if (!found.includes(match[0])) found.push(match[0]);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPlaceholders(item, found));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      collectPlaceholders(item, found)
    );
  }
}

export const GUIDE_PLACEHOLDERS: string[] = (() => {
  const found: string[] = [];
  collectPlaceholders(guideContent, found);
  return found;
})();
