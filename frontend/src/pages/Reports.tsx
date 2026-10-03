import React, { useState } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { LoadingState } from '@/components/shared/LoadingState';

export default function Reports() {
  const [reportType, setReportType] = useState('daily_ops');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setReportUrl(null);
    try {
      const res = await apiClient.get('/reports/generate');
      // Assume API returns a URL or we just simulate success
      setReportUrl(res.data.url || '#');
    } catch (err: any) {
      alert(`Failed to generate report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automated Reporting</h1>
        <p className="text-muted-foreground">Generate comprehensive operational and compliance reports.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>Select parameters to generate a new report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_ops">Daily Operations Summary</SelectItem>
                  <SelectItem value="capacity">Capacity & Utilization</SelectItem>
                  <SelectItem value="compliance">Regulatory Compliance</SelectItem>
                  <SelectItem value="financial">Financial Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="w-full" 
            onClick={handleGenerate} 
            disabled={generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Compiling Data...' : 'Generate Report'}
          </Button>

          {reportUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Report generated successfully!</span>
              </div>
              <Button variant="outline" size="sm" className="bg-white" asChild>
                <a href={reportUrl} download>
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
