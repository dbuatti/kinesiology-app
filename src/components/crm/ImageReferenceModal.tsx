import { Fragment, useEffect, useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CRANIAL_NERVES } from "@/data/cranial-nerve-data";
import { getMuscleInfo } from "@/data/muscle-info-data";
import type { MuscleInfo } from "@/data/muscle-info-data";

interface ImageReferenceModalProps {
  open: boolean;
  onClose: () => void;
}

const SINGLE_IMAGES = [
  { id: "pulse-points", title: "Pulse Points", description: "Wrist pulse positions — cun, guan, chi on left and right. Light pressure = Yang (superficial). Deep pressure = Yin (deep).", src: "/images/pulse-points.png", alt: "Pulse point positions on the wrist" },
  { id: "brain-zones", title: "Brain Zones", description: "Cortical and subcortical brain zones reference — primary zones, secondary zones, and their partner regions for correction.", src: "/images/brain-zones.png", alt: "Brain zones reference diagram" },
  { id: "cranial-sutures", title: "Cranial Sutures", description: "Temporal-parietal suture (halfway between top of ear and top of head) — glide test for lymphatic congestion. Stuck side indicates priority zone.", src: "/images/cranial-sutures.png", alt: "Cranial sutures reference diagram" },
];

const CN_IMAGES = CRANIAL_NERVES.map((cn) => ({
  id: `cn-${cn.id}`,
  title: cn.name,
  latin: cn.latinName,
  src: `/images/cranial-nerves/cn-${cn.id}.webp`,
  alt: `${cn.name} — ${cn.latinName}`,
}));

const LYMPH_IMAGES = [
  { id: "primary-ducts", title: "Primary Lymph Ducts & Key Drainage Sites", src: "/images/lymphatic/primary-ducts.png", alt: "Primary lymph ducts and key drainage sites" },
  { id: "cervical-maxillary", title: "Cervical & Maxillary Lymph Drainage", src: "/images/lymphatic/cervical-maxillary.png", alt: "Cervical and maxillary lymph drainage" },
  { id: "inguinal", title: "Inguinal Lymph Drainage", src: "/images/lymphatic/inguinal.png", alt: "Inguinal lymph drainage" },
  { id: "popliteal", title: "Popliteal Lymph Drainage", src: "/images/lymphatic/popliteal.png", alt: "Popliteal lymph drainage" },
];

interface MuscleOrganRow {
  organ: string;
  muscle: string;
  meridian: string;
  spinal: string;
}

const MUSCLE_ORGAN_DATA: MuscleOrganRow[] = [
  { organ: "Stomach", muscle: "Pec Major Clavicular", meridian: "Lung", spinal: "T5–T6" },
  { organ: "Liver", muscle: "Pec Major Sternal", meridian: "Pericardium", spinal: "T3–T8" },
  { organ: "Parotid Gland", muscle: "Pec Minor", meridian: "Lungs", spinal: "" },
  { organ: "Pancreas", muscle: "Latissimus Dorsi", meridian: "T4–T7", spinal: "" },
  { organ: "Gall Bladder", muscle: "Anterior Deltoid", meridian: "Lung", spinal: "T3–T4" },
  { organ: "Heart", muscle: "Middle Deltoid", meridian: "Large Intestine", spinal: "C7–T1" },
  { organ: "Lungs", muscle: "Posterior Deltoid", meridian: "San Jiao", spinal: "T3–T4" },
  { organ: "Stomach", muscle: "Biceps (Group)", meridian: "Pericardium", spinal: "C5" },
  { organ: "Stomach", muscle: "Biceps (Long Head)", meridian: "Pericardium", spinal: "C5" },
  { organ: "Spleen / Pancreas", muscle: "Triceps (Medial & Lateral Heads)", meridian: "Small Intestine", spinal: "T1" },
  { organ: "Spleen / Pancreas", muscle: "Triceps Long Head", meridian: "Small Intestine", spinal: "T1" },
  { organ: "Stomach / Sinus", muscle: "Deep Neck Flexors (Longus Colli)", meridian: "", spinal: "C2" },
  { organ: "Stomach", muscle: "SCM (Sternocleidomastoid)", meridian: "", spinal: "C2" },
  { organ: "Stomach", muscle: "Scalenes (Anterior)", meridian: "", spinal: "C2" },
  { organ: "Stomach", muscle: "Scalenes (Medial)", meridian: "", spinal: "C2" },
  { organ: "Stomach", muscle: "Scalenes (Posterior)", meridian: "", spinal: "C2" },
  { organ: "Stomach / Sinus", muscle: "Neck Extensors", meridian: "", spinal: "C2" },
  { organ: "Parathyroid", muscle: "Levator Scapula", meridian: "Small Intestine", spinal: "C5" },
  { organ: "Kidneys", muscle: "Upper Traps", meridian: "Lung", spinal: "C7" },
  { organ: "Spleen", muscle: "Middle Traps", meridian: "", spinal: "T5–T6" },
  { organ: "Spleen", muscle: "Lower Traps", meridian: "", spinal: "T6" },
  { organ: "Liver", muscle: "Rhomboids", meridian: "", spinal: "T3–T8" },
  { organ: "Thyroid / Brain", muscle: "Supraspinatus", meridian: "Central", spinal: "C1–C2, C7–T11" },
  { organ: "Hypothalamus / Heart", muscle: "Subscapularis", meridian: "", spinal: "C4–L2" },
  { organ: "Thymus", muscle: "Infraspinatus", meridian: "Small Intestine, San Jiao", spinal: "C6–T12" },
  { organ: "Thyroid", muscle: "Teres Minor", meridian: "", spinal: "T2" },
  { organ: "Spine", muscle: "Teres Major", meridian: "Governing Vessel", spinal: "T2" },
  { organ: "Stomach", muscle: "Diaphragm", meridian: "Pericardium", spinal: "T3, 4" },
  { organ: "Stomach", muscle: "Rectus Abdominals", meridian: "Stomach, Kidney", spinal: "T6" },
  { organ: "Stomach", muscle: "External Oblique", meridian: "", spinal: "T6" },
  { organ: "Stomach", muscle: "Internal Oblique", meridian: "", spinal: "T6" },
  { organ: "Stomach", muscle: "TVA (Transversus Abdominis)", meridian: "", spinal: "T6" },
  { organ: "Serratus Anterior", muscle: "", meridian: "Pericardium", spinal: "" },
  { organ: "Sacrospinalis", muscle: "", meridian: "Bladder", spinal: "T12" },
  { organ: "Bladder", muscle: "Erector Spinae", meridian: "", spinal: "" },
  { organ: "Kidney", muscle: "Multifidi", meridian: "Bladder", spinal: "" },
  { organ: "Large Intestine", muscle: "Quadratus Lumborum", meridian: "Kidney", spinal: "L4, 5" },
  { organ: "Bladder", muscle: "Anterior Pelvic Floor", meridian: "Bladder", spinal: "T3, 4" },
  { organ: "Bladder", muscle: "Posterior Pelvic Floor", meridian: "", spinal: "T3, 4" },
  { organ: "Ascending Colon", muscle: "Glute Max", meridian: "Bladder", spinal: "C2" },
  { organ: "Reproductive", muscle: "Glute Med", meridian: "Pericardium", spinal: "L5" },
  { organ: "Adrenal Medulla", muscle: "Glute Minimus", meridian: "", spinal: "" },
  { organ: "Large Intestine (Sigmoid Colon)", muscle: "TFL (Tensor Fasciae Latae)", meridian: "Gall Bladder", spinal: "L2" },
  { organ: "Adrenal Medulla", muscle: "Piriformis", meridian: "Gall Bladder, Pericardium", spinal: "S1" },
  { organ: "Kidneys", muscle: "Psoas", meridian: "Kidneys, Liver", spinal: "T11, 12" },
  { organ: "Small Intestine", muscle: "Quads (group)", meridian: "Stomach", spinal: "T10" },
  { organ: "Small Intestine", muscle: "Rectus Femoris", meridian: "Stomach", spinal: "T10" },
  { organ: "Heart", muscle: "Vastus Lateralis", meridian: "", spinal: "T10" },
  { organ: "Small Intestine", muscle: "VMO (Vastus Medialis Oblique)", meridian: "Stomach", spinal: "T10" },
  { organ: "Adrenal Cortex", muscle: "Sartorius", meridian: "Spleen", spinal: "T11" },
  { organ: "Rectum", muscle: "Gracilis", meridian: "Liver", spinal: "T12" },
  { organ: "Reproductive", muscle: "Adductors", meridian: "Kidney", spinal: "L1" },
  { organ: "Gall Bladder", muscle: "Popliteus", meridian: "Bladder", spinal: "C5, T12" },
  { organ: "Large Intestine", muscle: "Hamstrings (group)", meridian: "Bladder", spinal: "L4, 5" },
  { organ: "Large Intestine", muscle: "Lateral Hamstrings (Biceps Femoris)", meridian: "Bladder", spinal: "L4, 5" },
  { organ: "Large Intestine", muscle: "Medial Hamstrings (Semitendinosus / Semimembranosus)", meridian: "Bladder", spinal: "L4, 5" },
  { organ: "Adrenals", muscle: "Medial Gastrocnemius", meridian: "Bladder", spinal: "T11, 12" },
  { organ: "Adrenals", muscle: "Lateral Gastrocnemius", meridian: "Bladder", spinal: "T11, 12" },
  { organ: "Adrenals", muscle: "Soleus", meridian: "Bladder", spinal: "T11, 12" },
  { organ: "Bladder", muscle: "Tibialis Anterior", meridian: "Stomach", spinal: "S1" },
  { organ: "Adrenals", muscle: "Tibialis Posterior", meridian: "Gall Bladder", spinal: "L5" },
  { organ: "Bladder", muscle: "Peroneus Longus", meridian: "Gall Bladder", spinal: "T12" },
  { organ: "Extensor Hallucis Longus", muscle: "", meridian: "", spinal: "" },
  { organ: "Adrenal Cortex", muscle: "Flexor Hallucis Longus", meridian: "", spinal: "" },
  { organ: "Extensor Digitorum Longus", muscle: "", meridian: "", spinal: "" },
  { organ: "Flexor Digitorum Longus", muscle: "", meridian: "", spinal: "" },
];

interface LovettPair {
  segment: string;
  reciprocating: string;
  muscles: { name: string; gland: string }[];
}

const LOVETT_DATA: LovettPair[] = [
  { segment: "C1", reciprocating: "L5", muscles: [{ name: "Buccinator", gland: "Glucagon/Pancreas" }, { name: "Masseter", gland: "Thymus" }] },
  { segment: "C2", reciprocating: "L4", muscles: [{ name: "Diaphragm", gland: "Stomach" }, { name: "Subscapularis", gland: "Hypothalamus" }, { name: "External Pterygoid", gland: "Post Pituitary" }] },
  { segment: "C3", reciprocating: "L3", muscles: [{ name: "Dorsal Interossei", gland: "Thymus" }, { name: "Supraspinatus", gland: "Thyroid" }, { name: "Occipitalis", gland: "Thalamus" }] },
  { segment: "C4", reciprocating: "L2", muscles: [{ name: "Vastus Lateralis", gland: "Heart" }] },
  { segment: "C5", reciprocating: "L1", muscles: [{ name: "Posterior Deltoid", gland: "Lung" }] },
  { segment: "C6", reciprocating: "T12", muscles: [{ name: "Anterior Deltoid", gland: "Gall Bladder" }, { name: "Triceps", gland: "Spleen" }] },
  { segment: "C7", reciprocating: "T11", muscles: [{ name: "Pec Major Clavicular", gland: "Stomach" }, { name: "Orbicularis Oris", gland: "Exocrine Pancreas" }] },
  { segment: "T1", reciprocating: "T10", muscles: [{ name: "Pec Major Sternal", gland: "Liver" }] },
  { segment: "T2", reciprocating: "T9", muscles: [{ name: "Piriformis", gland: "Adrenal Medulla" }] },
  { segment: "T3", reciprocating: "T8", muscles: [{ name: "Psoas", gland: "Kidney" }] },
  { segment: "T4", reciprocating: "T7", muscles: [{ name: "Flex Hallucis Longus", gland: "Adrenal Cortex" }, { name: "Quadratus Lumborum", gland: "Large Intestine" }, { name: "Erector Spinae", gland: "Bladder" }] },
  { segment: "T5", reciprocating: "T6", muscles: [{ name: "Tensor Fascia Lata", gland: "Sigmoid Colon" }, { name: "Glute Maximus", gland: "Ascending Colon" }] },
  { segment: "T6", reciprocating: "T5", muscles: [{ name: "Tibialis Anterior", gland: "Bladder" }, { name: "Hamstrings", gland: "Large Intestine" }] },
];

type TabId = "pulse-points" | "brain-zones" | "cranial-sutures" | "cranial-nerves" | "muscle-organ" | "lovett-brothers" | "lymphatics";

export function ImageReferenceModal({ open, onClose }: ImageReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("pulse-points");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "organ" | "meridian" | "spinal">("organ");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCranialNerve, setSelectedCranialNerve] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return MUSCLE_ORGAN_DATA;
    const q = search.toLowerCase();
    return MUSCLE_ORGAN_DATA.filter(
      (r) =>
        r.organ.toLowerCase().includes(q) ||
        r.muscle.toLowerCase().includes(q) ||
        r.meridian.toLowerCase().includes(q) ||
        r.spinal.toLowerCase().includes(q)
    );
  }, [search]);

  const groupedRows = useMemo(() => {
    if (groupBy === "none") return null;
    const groups: Record<string, MuscleOrganRow[]> = {};
    const order: string[] = [];
    for (const row of filteredRows) {
      const key = groupBy === "organ" ? row.organ : groupBy === "meridian" ? (row.meridian || "—") : (row.spinal || "—");
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(row);
    }
    order.sort((a, b) => a.localeCompare(b));
    return order.map((key) => ({ key, rows: groups[key] }));
  }, [filteredRows, groupBy]);

  const muscleInfo = selectedMuscle ? getMuscleInfo(selectedMuscle) : null;

  const TAB_ORDER: TabId[] = ["pulse-points", "brain-zones", "cranial-sutures", "cranial-nerves", "muscle-organ", "lovett-brothers", "lymphatics"];

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (lightboxSrc) {
          setLightboxSrc(null);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (lightboxSrc) return; // Don't switch tabs while lightbox is open
        e.preventDefault();
        const idx = TAB_ORDER.indexOf(activeTab);
        if (idx === -1) return;
        const next = e.key === "ArrowLeft"
          ? (idx - 1 + TAB_ORDER.length) % TAB_ORDER.length
          : (idx + 1) % TAB_ORDER.length;
        setActiveTab(TAB_ORDER[next]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, activeTab, lightboxSrc]);

  if (!open) return null;

  const activeImage = SINGLE_IMAGES.find((img) => img.id === activeTab);
  const isGrid = activeTab === "cranial-nerves";
  const isTable = activeTab === "muscle-organ";
  const isLovett = activeTab === "lovett-brothers";
  const isLymph = activeTab === "lymphatics";

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Reference images"
      >
        <div
          className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-[14px] font-medium tracking-tight text-foreground">Reference Images</h2>
              <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-0.5 flex-wrap">
                {SINGLE_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveTab(img.id as TabId)}
                    className={cn(
                      "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                      activeTab === img.id
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {img.title}
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab("cranial-nerves")}
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                    activeTab === "cranial-nerves"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Cranial Nerves
                </button>
                <button
                  onClick={() => setActiveTab("muscle-organ")}
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                    activeTab === "muscle-organ"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Muscle-Organ Map
                </button>
                <button
                  onClick={() => setActiveTab("lovett-brothers")}
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                    activeTab === "lovett-brothers"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lovett Brothers
                </button>
                <button
                  onClick={() => setActiveTab("lymphatics")}
                  className={cn(
                    "rounded-md px-3 py-1 text-[11px] font-medium transition-colors",
                    activeTab === "lymphatics"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lymphatics
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {isGrid ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {CN_IMAGES.map((cn) => (
                    <div key={cn.id} className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => setSelectedCranialNerve(parseInt(cn.id.replace("cn-", "")))}
                        className="w-full overflow-hidden rounded-xl border border-border bg-white transition-all hover:ring-2 hover:ring-primary/30 hover:shadow-md"
                        style={{ aspectRatio: "3/4" }}
                      >
                        <img
                          src={cn.src}
                          alt={cn.alt}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = document.createElement("div");
                              placeholder.className = "flex h-full w-full items-center justify-center";
                              placeholder.innerHTML = '<div class="flex flex-col items-center gap-1 text-center p-2"><span class="text-2xl text-muted-foreground/20">∅</span><p class="text-[9px] text-muted-foreground/40">' + cn.src + '</p></div>';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      </button>
                      <div className="text-center">
                        <p className="text-[10px] font-medium text-foreground">{cn.title}</p>
                        <p className="text-[8.5px] text-muted-foreground/60">{cn.latin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isLovett ? (
              <div className="space-y-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Lovett Brother pairs — vertebrae coupled in motion. Impact on one vertebra influences its paired partner.
                </p>
                <div className="rounded-xl border border-border/60">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 z-20 bg-muted shadow-sm">
                      <tr className="border-b border-border/60">
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Spinal Segment</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Reciprocating</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Muscles (Gland/Organ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LOVETT_DATA.map((pair, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 font-bold text-foreground/90 tabular-nums">{pair.segment}</td>
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">{pair.reciprocating}</td>
                          <td className="px-3 py-2 text-foreground/80">
                            {pair.muscles.map((m, j) => (
                              <span key={j}>
                                {j > 0 && <span className="text-muted-foreground/40"> · </span>}
                                <button
                                  onClick={() => setSelectedMuscle(m.name)}
                                  className="font-medium text-foreground/80 hover:text-primary hover:underline underline-offset-2 transition-colors"
                                >
                                  {m.name}
                                </button>
                                <span className="text-muted-foreground/60 text-[9.5px]"> ({m.gland})</span>
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[9px] text-muted-foreground/40 text-center">
                  {LOVETT_DATA.length} spinal pairs
                </p>
              </div>
            ) : isLymph ? (
              <div className="space-y-3">
                {/* Lymph node reference — minimal, scannable */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { zone: "Primary Ducts", nodes: ["Right Lymphatic Duct", "Thoracic Duct", "Cisterna Chyli"] },
                    { zone: "Cervical & Maxillary", nodes: ["Maxillary/Facial", "Submental", "Submandibular", "Superficial cervical", "Deep cervical chain", "Posterior cervical", "Anterior cervical/Jugular", "Supraclavicular"] },
                    { zone: "Inguinal", nodes: ["Superficial inguinal", "Deep inguinal", "Femoral canal", "Superficial drainage pathways"] },
                    { zone: "Popliteal", nodes: ["Popliteal nodes", "Lateral foot/posterolateral leg", "Deep lymphatic drainage", "Superior drainage"] },
                  ].map((g) => (
                    <div key={g.zone} className="rounded-lg border border-border/50 bg-muted/20 p-2.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">{g.zone}</p>
                      <div className="flex flex-wrap gap-1">
                        {g.nodes.map((node) => (
                          <span key={node} className="rounded-md bg-card border border-border/40 px-2 py-0.5 text-[9.5px] font-medium text-foreground/80">
                            {node}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {LYMPH_IMAGES.map((img) => (
                    <div key={img.id} className="flex flex-col items-center gap-1.5">
                      <div className="w-full overflow-hidden rounded-xl border border-border bg-white cursor-zoom-in" style={{ aspectRatio: "4/3" }} onClick={() => setLightboxSrc(img.src)}>
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = document.createElement("div");
                              placeholder.className = "flex h-full w-full items-center justify-center";
                              placeholder.innerHTML = '<div class="flex flex-col items-center gap-1 text-center p-2"><span class="text-2xl text-muted-foreground/20">∅</span><p class="text-[9px] text-muted-foreground/40">' + img.src + '</p></div>';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                      </div>
                      <p className="text-[10px] font-medium text-foreground text-center">{img.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : isTable ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search muscle, organ, meridian, spinal level..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-muted/30 py-2 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">Group by:</span>
                  {(["none", "organ", "meridian", "spinal"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGroupBy(g)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors",
                        groupBy === g
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      {g === "none" ? "None" : g === "organ" ? "Organ" : g === "meridian" ? "Meridian" : "Spinal"}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border/60">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 z-20 bg-muted shadow-sm">
                      <tr className="border-b border-border/60">
                        {groupBy !== "organ" && <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Organ / Gland</th>}
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Muscle</th>
                        {groupBy !== "meridian" && <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Meridian</th>}
                        {groupBy !== "spinal" && <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Spinal</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedRows ? (
                        groupedRows.map((group) => {
                          return (
                            <Fragment key={group.key}>
                              <tr className="bg-primary/5">
                                <td colSpan={3} className="px-3 py-2 text-[10px] font-bold tracking-wider text-primary border-l-2 border-l-primary">
                                  {group.key} {group.rows.length > 1 && <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">({group.rows.length})</span>}
                                </td>
                              </tr>
                              {group.rows.map((row, i) => (
                                <tr key={group.key + '-' + i} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                  {groupBy !== "organ" && <td className="px-3 py-1.5 font-medium text-foreground/90">{(i > 0 && group.rows[i - 1].organ === row.organ) ? "〃" : (row.organ === group.key ? "—" : row.organ)}</td>}
                                  <td className="px-3 py-1.5">
                                    {row.muscle ? (
                                      <button onClick={() => setSelectedMuscle(row.muscle)} className="text-foreground/80 hover:text-primary hover:underline underline-offset-2 transition-colors text-left">
                                        {row.muscle}
                                      </button>
                                    ) : (
                                      <span className="text-muted-foreground/40">—</span>
                                    )}
                                  </td>
                                  {groupBy !== "meridian" && <td className="px-3 py-1.5 text-muted-foreground">{row.meridian === group.key ? "—" : (row.meridian || "—")}</td>}
                                  {groupBy !== "spinal" && <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{row.spinal === group.key ? "—" : (row.spinal || "—")}</td>}
                                </tr>
                              ))}
                            </Fragment>
                          );
                        })
                      ) : (
                        filteredRows.map((row, i) => {
                          const prevOrgan = i > 0 ? filteredRows[i - 1].organ : null;
                          const sameOrgan = prevOrgan === row.organ;
                          return (
                            <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className={cn("px-3 py-1.5 font-medium", sameOrgan ? "text-muted-foreground/30" : "text-foreground/90")}>
                                {sameOrgan ? "〃" : row.organ}
                              </td>
                              <td className="px-3 py-1.5">
                                {row.muscle ? (
                                  <button onClick={() => setSelectedMuscle(row.muscle)} className="text-foreground/80 hover:text-primary hover:underline underline-offset-2 transition-colors text-left">
                                    {row.muscle}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">{row.meridian || "—"}</td>
                              <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{row.spinal || "—"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-[9px] text-muted-foreground/40 text-center">
                  {filteredRows.length} of {MUSCLE_ORGAN_DATA.length} muscles
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] leading-relaxed text-muted-foreground">{activeImage?.description}</p>
                <div className="overflow-hidden rounded-xl border border-border bg-white cursor-zoom-in" onClick={() => activeImage?.src && setLightboxSrc(activeImage.src)}>
                  <img
                    src={activeImage?.src}
                    alt={activeImage?.alt}
                    className="w-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const placeholder = document.createElement("div");
                        placeholder.className = "flex h-64 items-center justify-center";
                        placeholder.innerHTML = '<div class="flex flex-col items-center gap-2 text-center"><span class="text-3xl text-muted-foreground/20">∅</span><p class="text-[11px] text-muted-foreground/60">' + (activeImage?.alt || "") + '</p><p class="text-[9px] text-muted-foreground/40">Add image to ' + (activeImage?.src || "") + '</p></div>';
                        parent.appendChild(placeholder);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-center border-t border-border/60 px-5 py-2">
            <span className="text-[9px] text-muted-foreground/40">
              Press <kbd className="rounded border border-border bg-muted/60 px-1 text-[8px] font-semibold">Esc</kbd> to close
            </span>
          </div>
        </div>
      </div>

      {selectedCranialNerve && (() => {
        const cn = CRANIAL_NERVES.find((c) => c.id === selectedCranialNerve);
        if (!cn) return null;
        return (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedCranialNerve(null)}
          >
            <div
              className="relative w-full max-w-md max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-foreground">{cn.name} — {cn.latinName}</h3>
                <button
                  onClick={() => setSelectedCranialNerve(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2 text-[11px]">
                {[
                  { label: "Nuclei", value: cn.nuclei },
                  { label: "Tone Effect", value: cn.toneEffect },
                  { label: "Reflex Point", value: cn.reflexPoint },
                  { label: "Stimulus", value: cn.stimulus },
                  { label: "Functions", value: cn.functions?.join(", ") },
                  { label: "Clinical Pearl", value: cn.clinicalPearl },
                  { label: "Dysfunction Consequences", value: cn.dysfunctionConsequences },
                  { label: "Acupoint", value: cn.acupoint },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label} className="border-b border-border/30 pb-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">{field.label}</p>
                    <p className="text-[11px] text-foreground/90 mt-0.5 leading-relaxed">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox for zoomed image */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Zoomed reference"
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {selectedMuscle && muscleInfo && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedMuscle(null)}
        >
          <div
            className="relative w-full max-w-md max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-foreground">{muscleInfo.name}</h3>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2 text-[11px]">
              {[
                { label: "Meridian", value: muscleInfo.meridian },
                { label: "Organ/Gland", value: muscleInfo.organGland },
                { label: "Nerve Supply", value: muscleInfo.nerveSupply },
                { label: "Spinal", value: muscleInfo.spinalFixation },
                { label: "Myotome", value: muscleInfo.myotome },
                { label: "Brainstem", value: muscleInfo.brainstemControl },
                { label: "Function", value: muscleInfo.function },
                { label: "Testing Position", value: muscleInfo.testingPosition },
                { label: "Clinical Indications", value: muscleInfo.clinicalIndications },
                { label: "Kinetic Chain", value: muscleInfo.kineticChain },
                { label: "Nutrition", value: muscleInfo.nutrition },
                { label: "Sedation Points", value: muscleInfo.sedationPoints },
                { label: "Neurolymphatic", value: muscleInfo.neurolymphatic },
                { label: "Neurovascular", value: muscleInfo.neurovascular },
                { label: "Pearl", value: muscleInfo.pearl },
                { label: "Description", value: muscleInfo.description },
              ].filter((f) => f.value).map((field) => (
                <div key={field.label} className="border-b border-border/30 pb-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">{field.label}</p>
                  <p className="text-[11px] text-foreground/90 mt-0.5 leading-relaxed">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ImageReferenceModal;