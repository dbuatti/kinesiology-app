import { INITIAL_APPOINTMENTS, INITIAL_CLIENTS } from "@/data/store";
import { groupAppointmentsByMonth } from "@/utils/crm-utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, User, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AppointmentsPage = () => {
  const grouped = groupAppointmentsByMonth(INITIAL_APPOINTMENTS);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM_Appointments</h1>
        <p className="text-slate-500">View and manage upcoming and past sessions</p>
      </div>

      <div className="space-y-10">
        {grouped.map(([month, apps]) => (
          <div key={month} className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
               <CalendarIcon size={18} className="text-indigo-500" />
               {month}
            </h2>
            <div className="grid gap-4">
              {apps.map(app => {
                const client = INITIAL_CLIENTS.find(c => c.id === app.clientId);
                return (
                  <Card key={app.id} className="hover:border-indigo-200 transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none font-bold">
                                {app.id}
                             </Badge>
                             <span className="font-bold text-lg">{client?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {format(app.date, "EEEE, d MMM • h:mm a")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Tag size={14} />
                              {app.tag}
                            </span>
                          </div>
                        </div>
                        <Badge variant={app.status === 'Completed' ? 'default' : 'outline'} className={app.status === 'Completed' ? 'bg-emerald-500' : ''}>
                          {app.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-50 text-sm text-slate-600">
                         <p><strong>Goal:</strong> {app.goal}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentsPage;