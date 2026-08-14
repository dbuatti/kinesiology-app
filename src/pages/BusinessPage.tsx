import { useState } from "react";
import { TrendingUp, PieChart, Users, Megaphone, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessDashboardTool } from "@/pages/BusinessDashboardPage";
import { BusinessOverviewTool } from "@/pages/BusinessOverviewPage";
import { ClientAuditTool } from "@/pages/ClientAuditPage";
import { MarketingEngineTool } from "@/pages/MarketingEnginePage";
import { FollowUpTool } from "@/pages/FollowUpPage";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "client-audit", label: "Client Audit", icon: Users },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "follow-up", label: "Follow-Up", icon: MessageSquare },
];

const BusinessPage = () => {
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && TABS.some((t) => t.id === tool) ? tool : "dashboard";
  });

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 pt-3">
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon size={14} />
              <span className="whitespace-nowrap">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsContent value="dashboard" className="m-0">
          <BusinessDashboardTool />
        </TabsContent>
        <TabsContent value="overview" className="m-0">
          <BusinessOverviewTool />
        </TabsContent>
        <TabsContent value="client-audit" className="m-0">
          <ClientAuditTool />
        </TabsContent>
        <TabsContent value="marketing" className="m-0">
          <MarketingEngineTool />
        </TabsContent>
        <TabsContent value="follow-up" className="m-0">
          <FollowUpTool />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessPage;
