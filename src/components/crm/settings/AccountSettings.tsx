"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showSuccess("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Card className="border-none shadow-lg rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-black flex items-center gap-3">
          <User size={22} className="text-rose-500" /> Account
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shrink-0">
            D
          </div>
          <div>
            <p className="font-black text-foreground">Daniele Buatti</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Practitioner · Active Session</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleSignOut}
          className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
        >
          <LogOut size={16} className="mr-2" /> Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default AccountSettings;
