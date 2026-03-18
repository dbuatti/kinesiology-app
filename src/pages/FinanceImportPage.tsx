"use client";

import React, { useState } from 'react';
import { importFinancesFromCSV } from '@/utils/finance-importer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, AlertCircle, FileText, DollarSign, Info } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/components/crm/AppLayout';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

const FinanceImportPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
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

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        const res = await importFinancesFromCSV(csvText);
        setResults(res);
        setLoading(false);
        if (res.success > 0) showSuccess(`Imported ${res.success} transactions!`);
      };
      reader.readAsText(file);
    } catch (error) {
      showError("Failed to read file.");
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Settings", path: "/settings" }, { label: "Finance Import" }]} />
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <DollarSign size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance Importer</h1>
            <p className="text-slate-500">Upload your transaction CSV files to track practice finances.</p>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            This importer is specifically designed for your <strong>Finances (Money Time)</strong> CSV format. 
            It will automatically handle currency formatting and categorization.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg rounded-[2rem] bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Upload CSV</CardTitle>
              <CardDescription>Select your transaction file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="csv-file">Transaction File (.csv)</Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer h-12 rounded-xl border-2 border-slate-100"
                />
              </div>
              
              {file && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{file.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}

              <Button 
                onClick={handleImport} 
                disabled={loading || !file}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-100"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload size={18} className="mr-2" />}
                {loading ? "Processing..." : "Start Import"}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="border-none shadow-lg rounded-[2rem] bg-white animate-in fade-in slide-in-from-right-4">
              <CardHeader>
                <CardTitle className="text-lg">Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <CheckCircle size={32} className="text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-emerald-900">{results.success}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Success</p>
                  </div>
                  <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <AlertCircle size={32} className="text-rose-600 mx-auto mb-2" />
                    <p className="text-2xl font-black text-rose-900">{results.failed}</p>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Failed</p>
                  </div>
                </div>
                {results.failed > 0 && (
                  <p className="text-xs text-slate-500 italic text-center">
                    Check the console for details on failed rows. Common issues include invalid date formats.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default FinanceImportPage;