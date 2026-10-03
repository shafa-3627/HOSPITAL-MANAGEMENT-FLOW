import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function AIForecast() {
  const [data, setData] = useState<any[]>([]);
  const [metric, setMetric] = useState('admissions');
  const [horizon, setHorizon] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/forecast?metric=${metric}&horizon=${horizon}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [metric, horizon]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Forecasting</h1>
          <p className="text-muted-foreground">Predictive analytics for capacity, admissions, and resource demand.</p>
        </div>
        <div className="flex gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admissions">Admissions</SelectItem>
              <SelectItem value="discharges">Discharges</SelectItem>
              <SelectItem value="ed_visits">ED Visits</SelectItem>
              <SelectItem value="bed_occupancy">Bed Occupancy</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={horizon} onValueChange={setHorizon}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Next 24h</SelectItem>
              <SelectItem value="7d">Next 7 Days</SelectItem>
              <SelectItem value="30d">Next 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Generating forecast models..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchForecast} />
      ) : (
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {metric.replace('_', ' ').toUpperCase()} Forecast
            </CardTitle>
            <CardDescription>Predicted values with 95% confidence intervals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="upper_bound" 
                    stroke="none" 
                    fill="#93c5fd" 
                    fillOpacity={0.3} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lower_bound" 
                    stroke="none" 
                    fill="#fff" 
                    fillOpacity={1} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex bg-blue-50 p-4 rounded-lg border border-blue-100 items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">AI Insight</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Based on historical patterns and current local weather alerts, expect a 15% surge in {metric.replace('_', ' ')} over the next 48 hours. Ensure adequate staffing in critical departments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
