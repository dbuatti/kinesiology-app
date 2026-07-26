import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/crm/AppLayout";
import AvailabilityPage from "./AvailabilityPage";
import { CalendarDays, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

// Dedicated Availability page. Viewing/booking sessions now lives in the unified
// Calendar (/calendar); this page is just for managing your live open hours.
const SchedulePage = () => {
  const navigate = useNavigate();
  return (
    <AppLayout variant="workspace">
      <div className="space-y-5">
        <PageHeader
          title="Availability"
          subtitle="Manage your live open hours. Book and view sessions from the Calendar."
          icon={CalendarDays}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-xl text-xs gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          }
        />
        <AvailabilityPage />
      </div>
    </AppLayout>
  );
};

export default SchedulePage;
