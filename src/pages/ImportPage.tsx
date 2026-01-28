import React, { useState } from 'react';
import { importAppointmentsFromCSV } from '@/utils/data-importer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
            showSuccess(`Import complete: ${res.success} successful, ${res.failed} failed.`);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      showError("An unexpected error occurred during file reading.");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appointment Data Importer</h1>
      <p className="text-slate-500">Upload your CSV file below to bulk import appointments. Ensure the client names match existing records.</p>

      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="csv-file" className="text-slate-700">Select CSV File (.csv)</Label>
            <Input 
              id="csv-file" 
              type="file" 
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer file:text-indigo-600 file:font-medium file:bg-indigo-50 file:border-indigo-200 file:rounded-lg file:hover:bg-indigo-100"
            />
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                </div>
                <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={loading || !file}
            className={cn(
                "w-full h-11",
                file ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload size={18} className="mr-2" />
            )}
            {loading ? "Importing..." : `Start Import (${file ? '1 file' : 'No file selected'})`}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Import Results</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
              <CheckCircle size={24} className="text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">Successful Imports</p>
                <p className="text-2xl font-bold text-emerald-900">{results.success}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
              <XCircle size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Failed/Skipped</p>
                <p className="text-2xl font-bold text-red-900">{results.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;