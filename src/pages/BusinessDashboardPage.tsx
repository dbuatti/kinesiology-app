import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';

const BusinessDashboardPage = () => {
  const [recentPaid, setRecentPaid] = useState<any[]>([]);

  useEffect(() => {
    const fetchPaid = async () => {
      const { data: paid } = await supabase.from('appointments').select('*').eq('payment_received', true);
      const { data: paidVoice } = await supabase.from('voice_bookings').select('*').eq('status', 'paid');
      
      const combined = [...(paid || []).slice(0, 5), ...(paidVoice || []).slice(0, 5)].sort((a, b) => {
        const da = (a as any).date || (a as any).lesson_date || "";
        const db = (b as any).date || (b as any).lesson_date || "";
        return db.localeCompare(da);
      });
      setRecentPaid(combined);
    };
    fetchPaid();
  }, []);

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
        <ul>
          {recentPaid.map((item, idx) => (
            <li key={idx} className="py-2 border-b">
              {(item as any).student_name || (item as any).clients?.[0]?.name} - {(item as any).date || (item as any).lesson_date}
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
};

export default BusinessDashboardPage;