import React, { useState } from 'react';
import { importAppointmentsFromCSV } from '@/utils/data-importer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle, FileText, AlertCircle, Info, Database } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/crm/AppLayout';
import PageHeader from '@/components/shared/PageHeader';

const ImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else if (selectedFile) {
      showError("Please upload a valid CSV file.");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        const res = await importAppointmentsFromCSV(csvText);
        setResults(res);
        setLoading(false);
        
        if (res.success > 0) {
          showSuccess(`Import complete: ${res.success} successful, ${res.failed} failed/skipped.`);
        } else if (res.failed > 0) {
          showError(`Import failed: ${res.failed} appointments could not be imported.`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      showError("An unexpected error occurred during file reading.");
      setLoading(false);
    }
  };

  return (
    <AppLayout variant="workspace">
      <div className="space-y-10 animate-in fade-in duration-700">
        <PageHeader 
          title="Data Importer"
          subtitle="Bulk import appointments from your legacy Notion database."
          icon={Database}
          breadcrumbs={[{ label: "System", path: "/settings" }, { label: "Import" }]}
        />

        <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900 font-medium">
            <strong>Important:</strong> Client names in your CSV must match existing clients in the database. 
            The importer will automatically extract names from Notion URL formats and skip appointments with duplicate IDs.
          </AlertDescription>
        </Alert>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black">Upload CSV File</CardTitle>
            <CardDescription className="font-medium">Select a CSV file exported from your Notion database.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="csv-file" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select CSV File (.csv)</Label>
              <Input 
                id="csv-file" 
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer file:text-indigo-600 file:font-black file:text-[10px] file:uppercase file:tracking-widest file:bg-indigo-50 file:border-none file:rounded-lg file:hover:bg-indigo-100 h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center"
              />
            </div>
            
            {file && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in zoom-in-95">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500">
                    <FileText size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-xs">{file.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            )}

            <Button 
              onClick={handleImport} 
              disabled={loading || !file}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all",
                file ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Upload size={20} className="mr-2" />
              )}
              {loading ? "Importing..." : `Start Import${file ? '' : ' (No file selected)'}`}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden animate-in slide-in-from-top-4">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black">Import Results</CardTitle>
              <CardDescription className="font-medium">
                {results.success > 0 && results.failed === 0 && "All appointments imported successfully!"}
                {results.success > 0 && results.failed > 0 && "Import completed with some issues"}
                {results.success === 0 && results.failed > 0 && "Import failed - please check the console for details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Successfully Imported</p>
                    <p className="text-3xl font-black text-emerald-900">{results.success}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-600">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Failed/Skipped</p>
                    <p className="text-3xl font-black text-amber-900">{results.failed}</p>
                  </div>
                </div>
              </div>
              {results.failed > 0 && (
                <Alert className="bg-amber-50 border-amber-200 rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-900 font-medium leading-relaxed">
                    Some appointments were skipped. Common reasons include: duplicate IDs, client names not found in database, 
                    or invalid date formats. Check the browser console for detailed error messages.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ImportPage;