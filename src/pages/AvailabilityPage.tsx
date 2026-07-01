
import CalcomSlotsView from "@/components/crm/CalcomSlotsView";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const AvailabilityPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
        <Button variant="outline" className="rounded-lg h-12 px-6 font-bold border-border bg-card" asChild>
          <a href="https://cal.com/dashboard" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={18} className="mr-2" /> Open Cal.com
          </a>
        </Button>
      </div>

      <CalcomSlotsView />
    </div>
  );
};

export default AvailabilityPage;