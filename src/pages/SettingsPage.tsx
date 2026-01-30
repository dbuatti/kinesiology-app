import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, LogOut, Upload, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useNavigate, Link } from "react-router-dom";

const SettingsPage = () => {
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account and application preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User size={20} className="text-indigo-500" /> Account
            </CardTitle>
            <CardDescription>Manage your profile information and authentication.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Currently, only sign-out functionality is available here. Profile management features will be added soon.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full"
            >
              <LogOut size={18} className="mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database size={20} className="text-emerald-500" /> Data Management
            </CardTitle>
            <CardDescription>Import data from external sources like Notion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Use the importer to bulk upload appointments from a CSV file.
            </p>
            <Button 
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Link to="/import">
                <Upload size={18} className="mr-2" /> Import Appointment Data
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;