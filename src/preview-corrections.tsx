import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import "./styles/dark-palette.css";
import CorrectionsManualContent from "@/components/crm/CorrectionsManualContent";

const measure = () => {
  const lines: string[] = [];
  const modal = document.querySelector("[data-probe='modal']") as HTMLElement;
  if (!modal) return;
  const mr = modal.getBoundingClientRect();
  lines.push(
    `MODAL rect=${Math.round(mr.width)}x${Math.round(mr.height)} client=${modal.clientWidth}x${modal.clientHeight} scroll=${modal.scrollWidth}x${modal.scrollHeight} overflowX=${getComputedStyle(modal).overflowX}`
  );

  const manual = Array.from(modal.children).find((el) =>
    String((el as HTMLElement).className).includes("h-full")
  ) as HTMLElement | undefined;
  if (manual) {
    const mr2 = manual.getBoundingClientRect();
    lines.push(`MANUAL rect=${Math.round(mr2.width)}x${Math.round(mr2.height)} bg=${getComputedStyle(manual).backgroundColor}`);
    Array.from(manual.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      lines.push(
        `  child[${i}] rect=${Math.round(r.width)}x${Math.round(r.height)} top=${Math.round(r.top - mr.top)} bg=${cs.backgroundColor} scroll=${el.scrollWidth}x${el.scrollHeight}`
      );
    });
  }

  const row = modal.querySelector(".flex.flex-1.overflow-hidden") as HTMLElement | null;
  const aside = modal.querySelector("aside") as HTMLElement | null;
  const mainEl = modal.querySelector("main") as HTMLElement | null;
  if (row) lines.push(`ROW w=${row.clientWidth} scrollW=${row.scrollWidth} h=${Math.round(row.getBoundingClientRect().height)}`);
  if (aside) {
    const r = aside.getBoundingClientRect();
    lines.push(`ASIDE w=${Math.round(r.width)} h=${Math.round(r.height)} scrollH=${aside.scrollHeight} children=${aside.children.length}`);
  }
  if (mainEl) {
    const r = mainEl.getBoundingClientRect();
    lines.push(
      `MAIN w=${Math.round(r.width)} h=${Math.round(r.height)} scroll=${mainEl.scrollWidth}x${mainEl.scrollHeight} overflowX=${getComputedStyle(mainEl).overflowX} hOverflow=${mainEl.scrollWidth - mainEl.clientWidth}`
    );
  }

  // every element reproducing at the bottom edge of the modal
  const all = Array.from(modal.querySelectorAll("*")) as HTMLElement[];
  const bottoms = all
    .map((el) => ({ el, r: el.getBoundingClientRect(), cs: getComputedStyle(el) }))
    .filter(({ r, cs }) => {
      const gap = mr.bottom - r.bottom;
      return gap >= 0 && gap <= 40 && r.height > 0 && r.height <= 60 && cs.display !== "none";
    });
  lines.push(`BOTTOM_ELEMENTS=${bottoms.length}`);
  bottoms.slice(0, 20).forEach(({ el, r, cs }) => {
    lines.push(
      `  bottom <${el.tagName.toLowerCase()}> w=${Math.round(r.width)} h=${Math.round(r.height)} gap=${Math.round(mr.bottom - r.bottom)} bg=${cs.backgroundColor} text="${(el.textContent || "").trim().slice(0, 30)}"`
    );
  });

  // contrast probe: what sits directly under the manual's content
  lines.push(`BODY_BG=${getComputedStyle(document.body).backgroundColor} CARD=${getComputedStyle(modal).backgroundColor}`);

  const pre = document.createElement("pre");
  pre.id = "report";
  pre.textContent = lines.join("\n");
  document.body.appendChild(pre);
};

const App = () => {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const item = params.get("item");

    const clickByText = (selector: string, text: string) => {
      const el = (Array.from(document.querySelectorAll(selector)) as HTMLElement[]).find(
        (e) => (e.textContent || "").trim().toLowerCase() === text.toLowerCase()
      );
      if (!el) return;
      // Radix activates tabs on pointer/mouse down, not on click().
      ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((type) =>
        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
      );
    };

    const t1 = window.setTimeout(() => tab && clickByText('[role="tab"]', tab), 300);
    const t2 = window.setTimeout(() => item && clickByText("aside button", item), 600);
    const t3 = window.setTimeout(measure, 1200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 p-10">
      <div className="mx-auto w-full max-w-4xl">
        <div data-probe="modal" className="bg-card rounded-2xl border border-border shadow-lg max-h-[85vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-2">
            <h2 className="text-lg font-semibold text-foreground">Corrections Manual</h2>
          </div>
          <CorrectionsManualContent />
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
