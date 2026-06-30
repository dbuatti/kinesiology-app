import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const BusinessOverviewPage = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('voice_bookings').select('*');
      setItems(data || []);
    };
    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="p-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-4 px-4">Student</th>
              <th className="py-4 px-4 text-right">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-4 px-4">{item.student_name}</td>
                <td className="py-4 px-4 text-right">
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full",
                    (item.source as string) === "both" ? "bg-chart-primary/10 text-chart-primary" : 
                    (item.source as string) === "kine" ? "bg-chart-primary/10 text-chart-primary" : 
                    "bg-chart-destructive/10 text-chart-destructive"
                  )}>
                    {(item.source as string) === "both" ? "Both" : (item.source as string) === "kine" ? "Kine" : "Voice"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

export default BusinessOverviewPage;