"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DataIntegrityCheckProps {
  clients: any[];
}

const DataIntegrityCheck = ({ clients }: DataIntegrityCheckProps) => {
  const clientsWithMissingData = useMemo(() => {
    return clients.map(client => {
      const missing = [];
      if (!client.email) missing.push({ label: 'Email', icon: Mail });
      if (!client.phone) missing.push({ label: 'Phone', icon: Phone });
      if (!client.born) missing.push({ label: 'DOB', icon: Calendar });
      if (!client.suburbs || client.suburbs.length === 0) missing.push({ label: 'Suburb', icon: MapPin });
      
      return {
        ...client,
        missingFields: missing
      };
    }).filter(c => c.missingFields.length > 0)
      .sort((a, b) => b.missingFields.length - a.missingFields.length);
  }, [clients]);

  if (clientsWithMissingData.length === 0) {
    return (
      <Card className="border-none shadow-lg rounded-[2.5rem] bg-emerald-50 border-2 border-emerald-100">
        <CardContent className="p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-black text-emerald-900">Data Integrity: 100%</h3>
          <p className="text-emerald-700 font-medium">All clients have complete pivotal data profiles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <ShieldAlert size={24} className="text-amber-500" /> Data Integrity Check
            </CardTitle>
            <CardDescription className="font-medium">Identifying profiles missing pivotal contact or clinical data.</CardDescription>
          </div>
          <Badge className="bg-amber-500 text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
            {clientsWithMissingData.length} Profiles
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {clientsWithMissingData.map((client) => (
            <div key={client.id} className="p-6 border-b border-border hover:bg-muted/20 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-foreground group-hover:text-indigo-600 transition-colors">{client.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {client.missingFields.map((field: any) => (
                      <span key={field.label} className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/30">
                        <field.icon size={8} /> Missing {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link to={`/clients/${client.id}`}>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600">
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataIntegrityCheck;