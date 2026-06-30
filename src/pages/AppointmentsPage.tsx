import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmptyState } from '@/components/ui/empty-state';

const AppointmentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);

  return (
    <AppLayout>
      <div className="p-6">
        <EmptyState 
          title="No Appointments Found"
          description="Try adjusting your search or schedule a new session."
          onAction={() => { setSearch(""); setStatusFilter("all"); setOpen(true); }}
        />
      </div>
    </AppLayout>
  );
};

export default AppointmentsPage;