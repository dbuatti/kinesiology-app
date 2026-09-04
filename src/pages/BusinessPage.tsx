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
  { id: "client-audit", label: "Audit", icon: Users },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "follow-up", label: "Follow-Up", icon: MessageSquare },
];

const BusinessPage = () => {
  const [tab, setTab] = useState(() => {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return tool && TABS.some((t) => t.id === tool) ? tool : "dashboard";
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <div className="sticky top-0 z-10 bg-background border-b border-border pt-3">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <TabsList className="w-full flex-wrap gap-1 bg-muted/60 rounded-xl p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                <t.icon size={14} />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      <TabsContent value="dashboard" className="m-0">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6"><BusinessDashboardTool /></div>
        </TabsContent>
        <TabsContent value="overview" className="m-0">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6"><BusinessOverviewTool /></div>
        </TabsContent>
        <TabsContent value="client-audit" className="m-0">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6"><ClientAuditTool /></div>
        </TabsContent>
        <TabsContent value="marketing" className="m-0">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6"><MarketingEngineTool /></div>
        </TabsContent>
        <TabsContent value="follow-up" className="m-0">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 py-6"><FollowUpTool /></div>
        </TabsContent>
    </Tabs>
  );
};

export default BusinessPage;
