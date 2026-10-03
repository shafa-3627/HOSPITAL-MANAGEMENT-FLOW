import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ActivitySquare, AlertTriangle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnomalyDetection() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/anomalies');
      setAnomalies(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  if (loading) return <LoadingState message="Scanning metrics for statistical anomalies..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnomalies} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Anomaly Detection</h1>
          <p className="text-muted-foreground">AI-driven identification of abnormal operational patterns.</p>
        </div>
        <Button onClick={fetchAnomalies} variant="outline">Run Scan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {anomalies.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
            No statistical anomalies detected in the current operational data.
          </div>
        ) : (
          anomalies.map((anomaly, idx) => (
            <Card key={idx} className="border-l-4 border-l-amber-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">{anomaly.metric}</CardTitle>
                </div>
                <CardDescription>Detected at {anomaly.detected_at}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="text-center flex-1 border-r">
                    <div className="text-sm text-slate-500">Current Value</div>
                    <div className="text-2xl font-bold text-amber-600">{anomaly.current_value}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-sm text-slate-500">Expected Baseline</div>
                    <div className="text-2xl font-bold text-slate-700">{anomaly.expected_baseline}</div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md flex gap-2 border border-blue-100">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">AI Assessment: </span>
                    {anomaly.description || `Deviation of ${Math.abs(anomaly.current_value - anomaly.expected_baseline)} points from the moving average.`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
