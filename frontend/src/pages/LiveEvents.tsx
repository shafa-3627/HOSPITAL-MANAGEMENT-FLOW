import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { 
  Activity, Bell, Pause, Play, AlertCircle, Info, AlertTriangle, 
  CheckCircle2, Zap, RefreshCw, Filter, Search, Siren, Radio, Layers
} from 'lucide-react';

interface HospitalEvent {
  id: number | string;
  event_type?: string;
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  description?: string;
  entity_id?: string;
  patient_id?: string;
  department?: string;
  source?: string;
  timestamp: string;
  isNew?: boolean;
}

export default function LiveEvents() {
  const [events, setEvents] = useState<HospitalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [streamActive, setStreamActive] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch from REST API
  const fetchInitialEvents = async () => {
    try {
      const res = await apiClient.get('/events');
      if (Array.isArray(res.data)) {
        setEvents(res.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to event stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialEvents();
  }, []);

  // SSE Stream Connection with Polling Fallback
  useEffect(() => {
    if (isPaused) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStreamActive(false);
      return;
    }

    setStreamActive(true);
    const sseUrl = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/events/stream`;

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStreamActive(true);
        setError(null);
      };

      es.onmessage = (e) => {
        try {
          const newEvent: HospitalEvent = JSON.parse(e.data);
          if (newEvent && newEvent.message && newEvent.event_type !== 'stream_connected') {
            setEvents((prev) => {
              // Deduplicate by id if matching
              if (prev.some((p) => p.id === newEvent.id)) return prev;
              const stamped = { ...newEvent, isNew: true };
              return [stamped, ...prev.slice(0, 79)];
            });
          }
        } catch (parseErr) {
          console.error('SSE parse error:', parseErr);
        }
      };

      es.onerror = () => {
        // If SSE fails or drops, close and fallback to lightweight polling
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setStreamActive(false);
      };
    } catch (err) {
      setStreamActive(false);
    }

    // Secondary background polling fallback (every 4s) to ensure uninterrupted flow
    const interval = setInterval(async () => {
      if (!isPaused && (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN)) {
        try {
          const res = await apiClient.get('/events?limit=40');
          if (Array.isArray(res.data)) {
            setEvents(res.data);
            setStreamActive(true);
          }
        } catch (pollErr) {
          // silent fallback
        }
      }
    }, 3500);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      clearInterval(interval);
    };
  }, [isPaused]);

  // Trigger Immediate Simulated Event on Demand
  const handleTriggerSimulatedEvent = async () => {
    setSimulating(true);
    try {
      const res = await apiClient.post('/events/simulate-single');
      if (res.data?.event) {
        const newEv = { ...res.data.event, isNew: true };
        setEvents((prev) => [newEv, ...prev.slice(0, 79)]);
        setToast(`Triggered: ${res.data.event.title || 'New Live Event'}`);
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err: any) {
      setToast(`Simulation error: ${err.message}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSimulating(false);
    }
  };

  // Reset Stream
  const handleResetStream = async () => {
    setLoading(true);
    try {
      await apiClient.post('/events/simulation/reset');
      await fetchInitialEvents();
      setToast('Live event stream reset with fresh telemetry feed.');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && events.length === 0) {
    return <LoadingState message="Connecting to live hospital SSE event stream..." />;
  }

  if (error && events.length === 0) {
    return <ErrorState message={error} onRetry={() => { setLoading(true); fetchInitialEvents(); }} />;
  }

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    const severity = (ev.severity || ev.type || '').toLowerCase();
    if (filterSeverity === 'critical' && severity !== 'critical') return false;
    if (filterSeverity === 'warning' && severity !== 'warning' && severity !== 'high') return false;
    if (filterSeverity === 'info' && severity !== 'info' && severity !== 'medium') return false;
    if (filterSeverity === 'success' && severity !== 'success' && severity !== 'low') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const msg = (ev.message || ev.description || '').toLowerCase();
      const pId = (ev.patient_id || ev.entity_id || '').toLowerCase();
      const dept = (ev.department || '').toLowerCase();
      const src = (ev.source || '').toLowerCase();
      return msg.includes(q) || pId.includes(q) || dept.includes(q) || src.includes(q);
    }
    return true;
  });

  const getEventIcon = (severity?: string) => {
    const s = (severity || 'info').toLowerCase();
    switch (s) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
      case 'low':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Radio className="w-5 h-5 text-[#357df9]" />;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    const s = (severity || 'info').toLowerCase();
    switch (s) {
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-bold">CRITICAL</Badge>;
      case 'warning':
      case 'high':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">WARNING</Badge>;
      case 'success':
      case 'low':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">DISPATCHED / COMPLETED</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-[#357df9] border-blue-200 text-[10px] font-bold">FLOW EVENT</Badge>;
    }
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return 'Just now';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1D3557] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Zap className="h-4 w-4 text-amber-400" />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-[#dadce0] dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D3557] dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Activity className={`w-7 h-7 ${isPaused ? 'text-slate-400' : 'text-[#33bd4a] animate-pulse'}`} />
              Live Hospital Event Stream
            </h1>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs ${
              isPaused 
                ? 'bg-slate-100 text-slate-600 border border-slate-300' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isPaused ? 'bg-slate-400' : 'bg-emerald-500 animate-ping'}`} />
              {isPaused ? 'STREAM PAUSED' : 'LIVE SSE CONNECTED'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#727586] dark:text-slate-400 mt-1">
            Real-time HL7/FHIR telemetry stream, clinical vital alerts, patient transfers, and operational event audit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            size="sm"
            className="bg-[#357df9] hover:bg-[#265ab2] text-white font-bold text-xs rounded-full px-4 gap-1.5 shadow-sm"
            onClick={handleTriggerSimulatedEvent}
            disabled={simulating}
          >
            <Zap className="w-3.5 h-3.5" />
            {simulating ? 'Broadcasting...' : '⚡ Trigger Live Event'}
          </Button>

          <Button 
            variant={isPaused ? "default" : "outline"}
            size="sm"
            className={`font-bold text-xs rounded-full px-4 gap-1.5 ${
              isPaused ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-slate-300 text-slate-700'
            }`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <><Play className="w-3.5 h-3.5" /> Resume Stream</> : <><Pause className="w-3.5 h-3.5" /> Pause Stream</>}
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 hover:text-slate-800 text-xs rounded-full"
            onClick={handleResetStream}
            title="Reset telemetry events"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stream Filter & Search Bar */}
      <Card className="border-[#dadce0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            <Button
              size="sm"
              variant={filterSeverity === 'all' ? 'default' : 'outline'}
              className={`h-7 text-xs font-bold rounded-full px-3 ${
                filterSeverity === 'all' ? 'bg-[#1D3557] text-white' : 'border-slate-200 text-slate-600'
              }`}
              onClick={() => setFilterSeverity('all')}
            >
              All Events ({events.length})
            </Button>
            <Button
              size="sm"
              variant={filterSeverity === 'critical' ? 'default' : 'outline'}
              className={`h-7 text-xs font-bold rounded-full px-3 ${
                filterSeverity === 'critical' ? 'bg-red-600 text-white' : 'border-red-200 text-red-600 hover:bg-red-50'
              }`}
              onClick={() => setFilterSeverity('critical')}
            >
              Critical Alarms ({events.filter(e => (e.severity || e.type) === 'critical').length})
            </Button>
            <Button
              size="sm"
              variant={filterSeverity === 'warning' ? 'default' : 'outline'}
              className={`h-7 text-xs font-bold rounded-full px-3 ${
                filterSeverity === 'warning' ? 'bg-amber-600 text-white' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
              }`}
              onClick={() => setFilterSeverity('warning')}
            >
              Warnings & EMS ({events.filter(e => (e.severity || e.type) === 'warning' || (e.severity || e.type) === 'high').length})
            </Button>
            <Button
              size="sm"
              variant={filterSeverity === 'info' ? 'default' : 'outline'}
              className={`h-7 text-xs font-bold rounded-full px-3 ${
                filterSeverity === 'info' ? 'bg-[#357df9] text-white' : 'border-blue-200 text-[#357df9] hover:bg-blue-50'
              }`}
              onClick={() => setFilterSeverity('info')}
            >
              Flow & Transfers ({events.filter(e => (e.severity || e.type) === 'info' || (e.severity || e.type) === 'medium').length})
            </Button>
            <Button
              size="sm"
              variant={filterSeverity === 'success' ? 'default' : 'outline'}
              className={`h-7 text-xs font-bold rounded-full px-3 ${
                filterSeverity === 'success' ? 'bg-emerald-600 text-white' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
              onClick={() => setFilterSeverity('success')}
            >
              Discharges & Orders ({events.filter(e => (e.severity || e.type) === 'success' || (e.severity || e.type) === 'low').length})
            </Button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search patient, bed, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-full border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Event Stream Feed */}
      <Card className="border-[#dadce0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 py-3.5 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold text-[#1D3557] dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#357df9]" />
            Real-Time Broadcast Ledger ({filteredEvents.length} active items)
          </CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Throughput: ~18 events/min</span>
            <span>•</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Radio className="h-3 w-3 animate-spin" /> Live Broker
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 max-h-[640px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Radio className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-slate-600">No matching events in the stream</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or click "Trigger Live Event" to simulate new telemetry.</p>
            </div>
          ) : (
            filteredEvents.map((event, idx) => {
              const severity = (event.severity || event.type || 'info').toLowerCase();
              const isCritical = severity === 'critical';
              const isWarning = severity === 'warning' || severity === 'high';
              const displayMsg = event.message || event.description || 'Operational event logged.';

              return (
                <div 
                  key={`${event.id}-${idx}`}
                  className={`p-4 sm:p-4.5 flex items-start gap-3.5 transition-all duration-300 hover:bg-slate-50/90 dark:hover:bg-slate-800/40 ${
                    isCritical 
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-l-4 border-l-red-500' 
                      : isWarning 
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-l-4 border-l-amber-500' 
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Icon Indicator */}
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 shadow-2xs ${
                    isCritical 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50' 
                      : isWarning 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50' 
                      : 'bg-blue-50 text-[#357df9] dark:bg-blue-900/30'
                  }`}>
                    {getEventIcon(severity)}
                  </div>

                  {/* Main Event Body */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#1D3557] dark:text-slate-100">
                          {event.title || event.event_type?.replace(/_/g, ' ').toUpperCase() || 'HOSPITAL EVENT'}
                        </span>
                        {getSeverityBadge(severity)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {displayMsg}
                    </p>

                    {/* Metadata Badges Footer */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800 border-slate-200 text-slate-600">
                        {event.department || 'Apex General Hospital'}
                      </Badge>
                      
                      {(event.patient_id || event.entity_id) && (
                        <Badge variant="outline" className="text-[10px] bg-indigo-50 border-indigo-200 text-indigo-700 font-mono font-bold">
                          Patient: {event.patient_id || event.entity_id}
                        </Badge>
                      )}

                      <span className="text-[10px] text-slate-400 font-medium">
                        Source: {event.source || 'Hospital Flow Broker'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
