import { useState } from "react";
import { TrendingUp, PieChart, Users, Megaphone } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BusinessDashboardTool } from "@/pages/BusinessDashboardPage";
import { BusinessOverviewTool } from "@/pages/BusinessOverviewPage";
import { ClientAuditTool } from "@/pages/ClientAuditPage";
import { MarketingEngineTool } from "@/pages/MarketingEnginePage";

// Follow-up ("who needs attention") lives entirely on /assistant now
// (NeedsAttentionWidget) — there is no separate Follow-Up tab/tool anymore.
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "client-audit", label: "Audit", icon: Users },
  { id: "marketing", label: "Marketing", icon: Megaphone },
];

const BusinessPage = () => {
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && TABS.some((t) => t.id === tool) ? tool : "dashboard";
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      {/* Plain underline tabs instead of the shadcn default filled-pill
          TabsList — that rendered as an oversized capsule with a lot of
          empty space on a wide screen ("tacky"). This drives the same
          controlled Tabs value/onValueChange from outside TabsTrigger, so
          Radix's show/hide logic below is untouched. */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="w-full px-4 md:px-8">
          <div className="flex gap-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* No px/py here — every Tool below already brings its own p-6, and
          stacking this wrapper's padding on top of that was pure double
          padding (full-width is the only thing actually needed at this
          level). */}
      <TabsContent value="dashboard" className="m-0">
          <div className="w-full"><BusinessDashboardTool /></div>
        </TabsContent>
        <TabsContent value="overview" className="m-0">
          <div className="w-full"><BusinessOverviewTool /></div>
        </TabsContent>
        <TabsContent value="client-audit" className="m-0">
          <div className="w-full"><ClientAuditTool /></div>
        </TabsContent>
        <TabsContent value="marketing" className="m-0">
          <div className="w-full"><MarketingEngineTool /></div>
        </TabsContent>
    </Tabs>
  );
};

export default BusinessPage;
