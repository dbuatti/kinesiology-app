import HubTabs from "@/components/shared/HubTabs";
import { useState } from "react";
import { Users, Megaphone } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ClientAuditTool } from "@/pages/ClientAuditPage";
import { MarketingEngineTool } from "@/pages/MarketingEnginePage";

// Follow-up ("who needs attention") lives entirely on /assistant now
// (NeedsAttentionWidget) — there is no separate Follow-Up tab/tool anymore.
const TABS = [
  { id: "client-audit", label: "Audit", icon: Users },
  { id: "marketing", label: "Marketing", icon: Megaphone },
];

// Hosts Client audit (/audit) and Marketing (/marketing); `tools` narrows the
// tab set to one. Money has its own page (src/pages/MoneyPage.tsx).
const BusinessPage = ({ tools }: { tools?: string[] } = {}) => {
  const tabs = tools ? TABS.filter((t) => tools.includes(t.id)) : TABS;
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && tabs.some((t) => t.id === tool) ? tool : tabs[0].id;
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      {/* Plain underline tabs instead of the shadcn default filled-pill
          TabsList — that rendered as an oversized capsule with a lot of
          empty space on a wide screen ("tacky"). This drives the same
          controlled Tabs value/onValueChange from outside TabsTrigger, so
          Radix's show/hide logic below is untouched. */}
      {tabs.length > 1 && <HubTabs value={tab} onChange={setTab} tabs={tabs} />}
      {/* No px/py here — every Tool below already brings its own p-6, and
          stacking this wrapper's padding on top of that was pure double
          padding (full-width is the only thing actually needed at this
          level). */}
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
