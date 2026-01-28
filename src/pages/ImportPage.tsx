import React, { useState } from 'react';
import { importAppointmentsFromCSV } from '@/utils/data-importer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const ImportPage = () => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    setResults(null);

    const res = await importAppointmentsFromCSV(csvText);
    setResults(res);
    setLoading(false);
    
    if (res.success > 0) {
        showSuccess(`Import complete: ${res.success} successful, ${res.failed} failed.`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Appointment Data Importer</h1>
      <p className="text-slate-500">Paste your CSV data below to bulk import appointments. Ensure the client names match existing records.</p>

      <Card className="border-none shadow-lg rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Paste CSV Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={15}
            placeholder="Paste the full content of your CSV file here..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button 
            onClick={handleImport} 
            disabled={loading || !csvText.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-11"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload size={18} className="mr-2" />
            )}
            {loading ? "Importing..." : "Start Import"}
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