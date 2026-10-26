import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import "./styles/dark-palette.css";
import CorrectionDock from "@/components/crm/corrections/CorrectionDock";
import { CorrectionDockProvider, useCorrectionDock } from "@/components/crm/corrections/CorrectionDockContext";

const press = (el: HTMLElement) => {
  ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((type) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }))
  );
};

const report = () => {
  const lines: string[] = [];
  const dock = document.querySelector("aside");
  if (!dock) {
    lines.push("NO DOCK");
  } else {
    const r = dock.getBoundingClientRect();
    const back = dock.querySelector('[title="Back to the process list"]');
    const list = dock.querySelector('[title="Back to the process list"]')?.parentElement?.nextElementSibling;
    const overflowing = (Array.from(dock.querySelectorAll("*")) as HTMLElement[])
      .map((el) => ({ el, dx: el.scrollWidth - el.clientWidth }))
      .filter((x) => x.dx > 1);
    lines.push(`DOCK w=${Math.round(r.width)} h=${Math.round(r.height)}`);
    lines.push(`INSTRUCTIONS_OPEN=${!!back}`);
    lines.push(`LIST_CHIPS=${dock.querySelectorAll("button").length}`);
    lines.push(`HORIZONTAL_OVERFLOWERS=${overflowing.length}`);
    overflowing.slice(0, 6).forEach(({ el, dx }) =>
      lines.push(`  +${dx}px <${el.tagName.toLowerCase()}> clientW=${el.clientWidth} "${String(el.className).slice(0, 60)}"`)
    );
    lines.push(`PAGE scrollW=${document.body.scrollWidth} viewport=${window.innerWidth}`);
    void list;
  }
  const pre = document.createElement("pre");
  pre.id = "report";
  pre.textContent = lines.join("\n");
  document.body.appendChild(pre);
};

const Drive = () => {
  const { openDock } = useCorrectionDock();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get("open");
    const clickLabel = params.get("click");

    const t1 = window.setTimeout(() => {
      if (open === "afferent") openDock({ tab: "afferent" });
      else if (open === "efferent") openDock({ tab: "efferent" });
      else if (open === "list") openDock();
      else if (open === "emotional") openDock({ tab: "efferent", item: "emotional" });
    }, 200);

    const t2 = window.setTimeout(() => {
      if (!clickLabel) return;
      const btn = (Array.from(document.querySelectorAll("aside button")) as HTMLElement[]).find(
        (b) => (b.textContent || "").trim() === clickLabel
      );
      if (btn) press(btn);
    }, 500);

    const delay = Number(params.get("delay") || 1100);
    const t3 = window.setTimeout(report, delay);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [openDock]);
  return null;
};

const App = () => (
  <CorrectionDockProvider appointmentId="probe">
    <Drive />
    <div className="min-h-screen bg-background">
      <div className="flex items-start">
        <div className="min-w-0 flex-1 p-6">
          <div className="h-24 rounded-xl border border-border bg-card" />
        </div>
        <CorrectionDock />
      </div>
    </div>
  </CorrectionDockProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
