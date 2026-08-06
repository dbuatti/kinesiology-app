import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Loader2 } from "lucide-react";
import PathwayReflexStimSheet from "@/components/crm/PathwayReflexStimSheet";
import { buildCheckedMap } from "@/components/crm/grid-checked";
import { useAppointment } from "@/hooks/useAppointment";
import { useCranialNerveTests } from "@/hooks/useCranialNerveTests";
import { usePrimitiveReflexTests } from "@/hooks/usePrimitiveReflexTests";

const GridSheetPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { appointment, loading: appLoading } = useAppointment(id);

  const { tests: nerveTests, loading: nerveLoading } = useCranialNerveTests(id);
  const { tests: reflexTests, loading: reflexLoading } = usePrimitiveReflexTests(id);
  const [printed, setPrinted] = useState(false);

  const checked = useMemo(
    () =>
      buildCheckedMap({
        reflexTests,
        nerveTests,
        priorityPattern: appointment?.priority_pattern,
      }),
    [reflexTests, nerveTests, appointment?.priority_pattern]
  );

  const loading = appLoading || nerveLoading || reflexLoading;

  const activeCount = Object.values(checked).filter(Boolean).length;
  const clientName = appointment?.clients?.name || "Client";
  const dateLabel = appointment?.date ? format(new Date(appointment.date), "EEEE, MMMM d, yyyy") : "";

  return (
    <div className="min-h-screen bg-muted py-8 px-4 print:p-0 print:bg-white">
      <div className="max-w-[297mm] mx-auto mb-8 flex items-center justify-between px-2 sm:px-0 print:hidden gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground h-10 px-3 text-xs sm:text-sm"
        >
          <ChevronLeft size={18} className="mr-1 sm:mr-2" /> Back
        </Button>

        <div className="text-center">
          <p className="text-sm font-bold text-foreground leading-tight">
            {loading ? "Grid Sheet" : (
              <>
                <button
                  type="button"
                  onClick={() => appointment?.clients?.id && navigate(`/clients/${appointment.clients.id}`)}
                  className="hover:text-chart-primary hover:underline underline-offset-2 transition-colors cursor-pointer"
                  title="Open client page"
                >
                  {clientName}
                </button>
                {" — Pathway / Reflex / Stim Sheet"}
              </>
            )}
          </p>
          {!loading && (
            <p className="text-[11px] text-muted-foreground">
              {dateLabel}
              {activeCount > 0 && <span className="font-semibold text-foreground"> · {activeCount} marked</span>}
            </p>
          )}
        </div>

        <Button
          onClick={() => {
            setPrinted(true);
            window.print();
          }}
          className="bg-primary text-primary-foreground rounded-xl shadow-lg font-bold h-10 px-4 text-xs sm:text-sm"
        >
          <Printer size={18} className="mr-1 sm:mr-2" /> {printed ? "Print Again" : "Print Sheet"}
        </Button>
      </div>

      {loading ? (
        <div className="max-w-[297mm] mx-auto bg-white shadow-2xl rounded-xl print:shadow-none">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-chart-primary" size={28} />
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Loading Grid Sheet...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-2xl print:shadow-none min-h-[0] w-full">
          <PathwayReflexStimSheet checked={checked} />
        </div>
      )}
    </div>
  );
};

export default GridSheetPage;
