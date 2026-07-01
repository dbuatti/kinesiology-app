import AppLayout from "@/components/crm/AppLayout";
import AvailabilityPage from "./AvailabilityPage";
import { CalendarDays } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

// Dedicated Availability page. Viewing/booking sessions now lives in the unified
// Calendar (/calendar); this page is just for managing your live open hours.
const SchedulePage = () => {
  return (
    <AppLayout variant="workspace">
      <div className="space-y-5">
        <PageHeader
          title="Availability"
          subtitle="Manage your live open hours. Book and view sessions from the Calendar."
          icon={CalendarDays}
        />
        <AvailabilityPage />
      </div>
    </AppLayout>
  );
};

export default SchedulePage;
