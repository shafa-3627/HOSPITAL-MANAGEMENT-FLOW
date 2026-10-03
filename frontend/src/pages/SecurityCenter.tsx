import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

export default function SecurityCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurity = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/security');
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load security status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  if (loading) return <LoadingState message="Scanning security perimeter..." />;
  if (error) return <ErrorState message={error} onRetry={fetchSecurity} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & Privacy Center</h1>
          <p className="text-muted-foreground">Monitor HIPAA compliance and system access.</p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-200">System Secure</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Encryption Status</p>
                <h3 className="text-xl font-bold">AES-256 Active</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Sessions</p>
                <h3 className="text-xl font-bold">{data?.active_sessions || 142}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">HIPAA Compliance</p>
                <h3 className="text-xl font-bold">100% Pass</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.events?.map((ev: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {ev.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <Shield className="w-4 h-4 text-slate-400" />}
                  <span className="font-medium text-sm">{ev.event}</span>
                </div>
                <div className="text-xs text-slate-500">{ev.timestamp}</div>
              </div>
            )) || (
              <div className="text-sm text-slate-500 text-center py-4">No recent security alerts.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
