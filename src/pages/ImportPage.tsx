import React, { useState } from 'react';
import { importAppointmentsFromCSV } from '@/utils/data-importer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, CheckCircle, XCircle, FileText, AlertCircle, Info } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
 <div className="p-4 md:p-8 max-w-full mx-auto space-y-6">
 <div>
 <h1 className="text-3xl font-medium tracking-tight text-foreground">Appointment Data Importer</h1>
 <p className="text-muted-foreground mt-2">Upload your CSV file to bulk import appointments. The system will automatically match client names and skip duplicates.</p>
 </div>

 <Alert className="bg-chart-primary/10 border-border">
 <Info className="h-4 w-4 text-chart-primary" />
 <AlertDescription className="text-sm text-blue-900">
 <strong>Important:</strong> Client names in your CSV must match existing clients in the database. 
 The importer will automatically extract names from Notion URL formats and skip appointments with duplicate IDs.
 </AlertDescription>
 </Alert>

 <Card className="border-none shadow-sm rounded-xl bg-white">
 <CardHeader>
 <CardTitle className="text-lg">Upload CSV File</CardTitle>
 <CardDescription>Select a CSV file exported from your Notion database</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid w-full items-center gap-1.5">
 <Label htmlFor="csv-file" className="text-foreground">Select CSV File (.csv)</Label>
 <Input 
 id="csv-file" 
 type="file" 
 accept=".csv"
 onChange={handleFileChange}
 className="cursor-pointer file:text-chart-primary file:font-medium file:bg-chart-primary/10 file:border-border file:rounded-lg file:hover:bg-chart-primary/10"
 />
 </div>
 
 {file && (
 <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-xl">
 <div className="flex items-center gap-3">
 <FileText size={20} className="text-primary" />
 <span className="text-sm font-medium text-foreground truncate max-w-xs">{file.name}</span>
 </div>
 <span className="text-xs text-muted-foreground/60">{(file.size / 1024).toFixed(2)} KB</span>
 </div>
 )}

 <Button 
 onClick={handleImport} 
 disabled={loading || !file}
 className={cn(
 "w-full h-11",
 file ? "bg-primary hover:bg-primary/90" : "bg-slate-300 text-muted-foreground cursor-not-allowed"
 )}
 >
 {loading ? (
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 ) : (
 <Upload size={18} className="mr-2" />
 )}
 {loading ? "Importing..." : `Start Import${file ? '' : ' (No file selected)'}`}
 </Button>
 </CardContent>
 </Card>

 {results && (
 <Card className="border-none shadow-sm rounded-xl">
 <CardHeader>
 <CardTitle className="text-lg">Import Results</CardTitle>
 <CardDescription>
 {results.success > 0 && results.failed === 0 && "All appointments imported successfully!"}
 {results.success > 0 && results.failed > 0 && "Import completed with some issues"}
 {results.success === 0 && results.failed > 0 && "Import failed - please check the console for details"}
 </CardDescription>
 </CardHeader>
 <CardContent className="grid grid-cols-2 gap-4">
 <div className="flex items-center gap-3 p-4 bg-chart-emerald/10 rounded-xl border border-border">
 <CheckCircle size={24} className="text-chart-emerald flex-shrink-0" />
 <div>
 <p className="text-sm font-medium text-emerald-800">Successfully Imported</p>
 <p className="text-2xl font-medium text-emerald-900">{results.success}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border">
 <AlertCircle size={24} className="text-muted-foreground flex-shrink-0" />
 <div>
 <p className="text-sm font-medium text-muted-foreground">Failed/Skipped</p>
 <p className="text-2xl font-medium text-muted-foreground">{results.failed}</p>
 </div>
 </div>
 </CardContent>
 {results.failed > 0 && (
 <CardContent className="pt-0">
 <Alert className="bg-muted border-border">
 <AlertCircle className="h-4 w-4 text-muted-foreground" />
 <AlertDescription className="text-sm text-muted-foreground">
 Some appointments were skipped. Common reasons include: duplicate IDs, client names not found in database, 
 or invalid date formats. Check the browser console for detailed error messages.
 </AlertDescription>
 </Alert>
 </CardContent>
 )}
 </Card>
 )}
 </div>
 );
};

export default ImportPage;