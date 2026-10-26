import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import "./styles/dark-palette.css";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";

const App = () => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const lines: string[] = [];
      const modal = document.querySelector("[data-probe='modal']") as HTMLElement;
      if (!modal) return;
      const mr = modal.getBoundingClientRect();
      lines.push(
        `MODAL rect=${Math.round(mr.width)}x${Math.round(mr.height)} client=${modal.clientWidth}x${modal.clientHeight} scroll=${modal.scrollWidth}x${modal.scrollHeight}`
      );
      lines.push(
        `  overflowX=${getComputedStyle(modal).overflowX} overflowY=${getComputedStyle(modal).overflowY}`
      );

      // Direct children of the manual root
      const manual = modal.querySelector("[data-probe='manual']") as HTMLElement;
      if (manual) {
        const mr2 = manual.getBoundingClientRect();
        lines.push(`MANUAL rect=${Math.round(mr2.width)}x${Math.round(mr2.height)}`);
        Array.from(manual.children).forEach((child, i) => {
          const el = child as HTMLElement;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          lines.push(
            `  child[${i}] <${el.tagName.toLowerCase()} class="${el.className}"> rect=${Math.round(r.width)}x${Math.round(r.height)} top=${Math.round(r.top - mr.top)} bg=${cs.backgroundColor} scrollH=${el.scrollHeight}`
          );
        });
      }

      // Any thin white-ish bar inside the modal
      const all = Array.from(modal.querySelectorAll("*")) as HTMLElement[];
      const bars = all
        .map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { el, r, bg: cs.backgroundColor, cs };
        })
        .filter(({ r, bg, cs }) => {
          const whiteish = bg === "rgb(255, 255, 255)" || bg === "rgb(250, 250, 250)";
          const thin = r.height > 0 && r.height <= 28;
          const wide = r.width > 200;
          return whiteish && thin && wide && cs.display !== "none";
        });
      lines.push(`WHITE_THIN_BARS=${bars.length}`);
      bars.forEach(({ el, r, bg }) => {
        const cs = getComputedStyle(el);
        lines.push(
          `  bar <${el.tagName.toLowerCase()}> w=${Math.round(r.width)} h=${Math.round(r.height)} bottomGap=${Math.round(mr.bottom - r.bottom)} bg=${bg} pos=${cs.position} class="${String(el.className).slice(0, 90)}"`
        );
      });

      // Anything reproducing at the very bottom of the modal
      const bottomBand = all
        .map((el) => ({ el, r: el.getBoundingClientRect(), cs: getComputedStyle(el) }))
        .filter(({ r, cs }) => {
          const gap = mr.bottom - r.bottom;
          return gap >= 0 && gap <= 30 && r.height > 0 && r.height <= 40 && cs.display !== "none";
        });
      lines.push(`BOTTOM_BAND_ELEMENTS=${bottomBand.length}`);
      bottomBand.slice(0, 25).forEach(({ el, r, cs }) => {
        lines.push(
          `  bottom <${el.tagName.toLowerCase()}> w=${Math.round(r.width)} h=${Math.round(r.height)} gap=${Math.round(mr.bottom - r.bottom)} bg=${cs.backgroundColor} class="${String(el.className).slice(0, 80)}"`
        );
      });

      const pre = document.createElement("pre");
      pre.id = "report";
      pre.textContent = lines.join("\n");
      document.body.appendChild(pre);
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 p-10">
      <div className="mx-auto w-full max-w-4xl">
        <div data-probe="modal" className="bg-card rounded-2xl border border-border shadow-lg max-h-[85vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-2">
            <h2 className="text-lg font-semibold text-foreground">Corrections Manual</h2>
          </div>
          <div data-probe="manual">
            <CorrectionsManualContent />
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
