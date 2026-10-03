import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Building2, Activity, Users } from 'lucide-react';

export default function HospitalNetwork() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/network/hospitals');
      setHospitals(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load network data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  if (loading) return <LoadingState message="Mapping regional hospital network..." />;
  if (error) return <ErrorState message={error} onRetry={fetchHospitals} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hospital Network</h1>
          <p className="text-muted-foreground">Multi-facility capacity sharing and load balancing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hospitals.map((hospital, idx) => (
          <Card key={idx} className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{hospital.name}</CardTitle>
                    <CardDescription>{hospital.distance} miles away</CardDescription>
                  </div>
                </div>
                <Badge variant={hospital.status === 'Diverting' ? 'destructive' : 'default'} className={hospital.status === 'Accepting' ? 'bg-green-600 hover:bg-green-700' : ''}>
                  {hospital.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">ED Wait Time</div>
                    <div className="font-semibold">{hospital.ed_wait_mins} mins</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-sm text-slate-500">Bed Occupancy</div>
                    <div className="font-semibold">{hospital.occupancy}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {hospitals.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-500 border rounded-lg bg-slate-50">
            No partner hospitals configured in this network.
          </div>
        )}
      </div>
    </div>
  );
}
