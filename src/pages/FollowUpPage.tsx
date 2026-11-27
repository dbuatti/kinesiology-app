import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import HubTabs from "@/components/shared/HubTabs";
import PageHeader from "@/components/shared/PageHeader";
import { AlertCircle, Users } from "lucide-react";
import { ClientHeatmapTool } from "@/components/money/ClientHeatmapTool";
import FollowUpTab from "@/components/assistant/FollowUpTab";

const TABS = [
  { id: "followup", label: "Follow-up", icon: AlertCircle },
  { id: "rebook", label: "Who to rebook", icon: Users },
];

/**
 * Follow-up — one place for client attention: the triage queue (who's drifting,
 * quick wins) and the rebooking heat map (recency + traction). Both are
 * relationship tasks, so they live together here rather than in Money.
 */
const FollowUpPage = () => {
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (tool === "rebook" || tool === "heatmap" || tool === "heat-map") return "rebook";
    return "followup";
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <HubTabs value={tab} onChange={setTab} tabs={TABS} />
      <TabsContent value="followup" className="m-0">
        <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageHeader icon={AlertCircle} title="Follow-up" subtitle="Who's drifting, quick wins first — book or reach out in one tap." />
          <FollowUpTab />
        </div>
      </TabsContent>
      <TabsContent value="rebook" className="m-0">
        <div className="w-full space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageHeader icon={Users} title="Who to rebook" subtitle="Recency plus traction — who to keep close, rebook or let go." />
          <ClientHeatmapTool />
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default FollowUpPage;