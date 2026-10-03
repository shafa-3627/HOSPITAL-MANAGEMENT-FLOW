import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { BrainCircuit, Play, CheckCircle } from 'lucide-react';

export default function AIModelLab() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/model/evaluations');
      setEvaluations(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load model evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvals();
  }, []);

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      await apiClient.post('/model/evaluate');
      await fetchEvals();
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <LoadingState message="Loading model performance metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchEvals} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Model Lab</h1>
          <p className="text-muted-foreground">Monitor and evaluate the performance of underlying ML models.</p>
        </div>
        <Button onClick={runEvaluation} disabled={evaluating} className="bg-indigo-600 hover:bg-indigo-700">
          <Play className="w-4 h-4 mr-2" />
          {evaluating ? 'Running Pipeline...' : 'Run Full Evaluation'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evaluations.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
            No evaluations found. Run a new evaluation pipeline.
          </div>
        ) : (
          evaluations.map((ev, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  <CardTitle className="text-lg">{ev.model_name}</CardTitle>
                </div>
                <CardDescription>Version: {ev.version} | Last evaluated: {ev.last_evaluated}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">Accuracy (F1 Score)</span>
                    <span className="font-bold">{Math.round(ev.accuracy * 100)}%</span>
                  </div>
                  <Progress value={ev.accuracy * 100} className="h-2 [&>div]:bg-indigo-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-xs text-slate-500">Precision</div>
                    <div className="text-lg font-semibold">{ev.precision?.toFixed(3) || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border">
                    <div className="text-xs text-slate-500">Recall</div>
                    <div className="text-lg font-semibold">{ev.recall?.toFixed(3) || 'N/A'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                  <CheckCircle className="w-4 h-4" />
                  Model exceeds production threshold.
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
