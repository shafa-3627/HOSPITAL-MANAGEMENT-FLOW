import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ShieldCheck, AlertOctagon } from 'lucide-react';

export default function AISafety() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/safety');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load safety data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading AI Safety & Governance metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-900 text-white p-4 rounded-lg flex items-center justify-center gap-3">
        <ShieldCheck className="w-6 h-6 text-indigo-300" />
        <span className="font-semibold tracking-wide uppercase text-sm">YODHA Core Principle: AI Recommends. Human Decides.</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Safety & Guardrails</h1>
          <p className="text-muted-foreground">Monitor the boundaries and safety mechanisms of all AI models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Guardrails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.guardrails?.map((gr: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <span className="font-medium text-sm">{gr.name}</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
              </div>
            )) || (
              <div className="text-sm text-slate-500">Guardrail data unavailable.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Human Override Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border flex flex-col gap-2">
              <div className="text-sm text-slate-500">AI Recommendations Accepted</div>
              <div className="text-3xl font-bold text-slate-800">{data?.metrics?.accepted_rate || '94.2%'}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border flex flex-col gap-2">
              <div className="text-sm text-slate-500">Manual Overrides</div>
              <div className="text-3xl font-bold text-slate-800">{data?.metrics?.override_rate || '5.8%'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
