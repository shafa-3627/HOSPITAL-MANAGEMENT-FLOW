import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Package, AlertTriangle, CheckCircle2, Truck, RefreshCw, 
  Flame, Zap, Clock, ShieldCheck, ArrowRight, X, Building2
} from 'lucide-react'

interface ResourceItem {
  id: number
  name: string
  type: string
  department_id: number
  total: number
  available: number
  in_use: number
  maintenance: number
  predicted_demand_6h: number
  predicted_demand_12h: number
  min_safety_threshold: number
  is_critical_shortage: boolean
  auto_reorder_enabled: boolean
}

interface EmergencyOrder {
  order_id: string
  resource_name: string
  quantity: number
  urgency: string
  supplier: string
  status: string
  eta_minutes: number
  dispatched_at: string
  destination: string
  tracking_code: string
}

export default function Resources() {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [orders, setOrders] = useState<EmergencyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Order modal
  const [orderModalItem, setOrderModalItem] = useState<ResourceItem | null>(null)
  const [orderQty, setOrderQty] = useState<number>(10)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resRes, ordersRes] = await Promise.all([
        apiClient.get('/resources'),
        apiClient.get('/resources/emergency-orders')
      ])
      setResources(resRes.data)
      setOrders(ordersRes.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load hospital equipment inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 1-Click Dispatch Emergency Order for Single Resource
  const handleEmergencyOrder = async () => {
    if (!orderModalItem) return
    setActionLoading(true)
    try {
      const res = await apiClient.post(`/resources/${orderModalItem.id}/emergency-order`, {
        quantity: orderQty,
        urgency: 'CRITICAL',
        reason: 'Automated Emergency Requisition Protocol'
      })
      setToast(res.data.message || `Emergency order dispatched for ${orderQty}x ${orderModalItem.name}!`)
      setOrderModalItem(null)
      await fetchData()
    } catch (err: any) {
      setToast(`Order dispatch failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Auto-Dispatch All Critical Shortages
  const handleAutoDispatchAll = async () => {
    setActionLoading(true)
    try {
      const res = await apiClient.post('/resources/auto-dispatch-critical')
      setToast(res.data.message || 'Emergency replenishment orders auto-dispatched for all low-stock equipment!')
      await fetchData()
    } catch (err: any) {
      setToast(`Auto-dispatch failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Connecting to Apex General Hospital central supply inventory..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  const criticalShortageCount = resources.filter(r => r.is_critical_shortage).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Emergency Equipment & Auto-Reorder Hub
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              Apex General Hospital
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time medical asset monitoring with automated emergency supplier replenishment when stock is critically low
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Inventory
          </Button>
          <Button 
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs font-semibold shadow-sm"
            onClick={handleAutoDispatchAll}
            disabled={actionLoading}
          >
            <Zap className="h-3.5 w-3.5" /> Auto-Dispatch All Low Assets
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Automated Emergency Rule Banner */}
      <Card className="border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white mt-0.5 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Automated Emergency Replenishment Protocol: ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Enforced
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                When available ventilators, oxygen, or monitors drop below the safety threshold (or predicted surge demand &gt; stock), the system automatically transmits an expedited requisition manifest to the State Medical Logistics Hub.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Equipment Types</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{resources.length} Categories</div>
          <div className="text-[11px] text-slate-500 mt-0.5">ICU & Emergency Wards</div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">Critical Low Stock</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">{criticalShortageCount} Items</div>
          <div className="text-[11px] text-red-600 mt-0.5">Auto-order required</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Active In-Transit Orders</div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">{orders.length} Dispatches</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Expedited courier en route</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Average Reorder ETA</div>
          <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">22 Mins</div>
          <div className="text-[11px] text-teal-600 mt-0.5">Direct to hospital dock</div>
        </div>
      </div>

      {/* Equipment Inventory Grid */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          Hospital Critical Resource Matrix
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {resources.map(res => {
            const isCritical = res.is_critical_shortage
            const usagePct = res.total > 0 ? Math.round((res.in_use / res.total) * 100) : 0

            return (
              <Card 
                key={res.id} 
                className={`border shadow-sm transition-all flex flex-col justify-between ${
                  isCritical 
                    ? 'border-red-300 bg-white dark:bg-slate-900 hover:border-red-400' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Package className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-teal-600'}`} />
                        <span>{res.name}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 capitalize">
                        Type: {res.type} • Min Safety Level: {res.min_safety_threshold} units
                      </CardDescription>
                    </div>

                    {isCritical ? (
                      <Badge variant="critical" className="text-[10px]">
                        CRITICAL SHORTAGE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                        ADEQUATE
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Stock Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                      <div className="text-[10px] text-slate-500">Available</div>
                      <div className={`text-lg font-bold ${isCritical ? 'text-red-700 font-black' : 'text-emerald-700'}`}>
                        {res.available}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                      <div className="text-[10px] text-slate-500">In Use</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {res.in_use}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border">
                      <div className="text-[10px] text-slate-500">Total Stock</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {res.total}
                      </div>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Active Utilization:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{usagePct}%</span>
                    </div>
                    <Progress value={usagePct} className={`h-1.5 ${usagePct >= 85 ? '[&>div]:bg-red-500' : '[&>div]:bg-teal-500'}`} />
                  </div>

                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>6h Predicted Demand:</span>
                    <span className="font-bold text-slate-900 dark:text-white">+{res.predicted_demand_6h} units</span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                      size="sm"
                      className={`w-full h-8 text-xs font-semibold gap-1.5 shadow-sm ${
                        isCritical 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                      }`}
                      onClick={() => {
                        setOrderModalItem(res)
                        setOrderQty(isCritical ? 10 : 5)
                      }}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      {isCritical ? 'Emergency Auto-Reorder' : 'Dispatch Requisition'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Live In-Transit Emergency Requisition Orders Feed */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="h-4 w-4 text-teal-600" />
              Live Emergency Requisition Dispatches (In-Transit & Delivered)
            </CardTitle>
            <span className="text-xs text-slate-500">{orders.length} Active Orders</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2.5">
          {orders.map((ord, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{ord.order_id}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">{ord.urgency}</span>
                  <span className="text-teal-700 dark:text-teal-400 font-semibold">• {ord.quantity}x {ord.resource_name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Supplier: {ord.supplier} • Destination: {ord.destination} • Tracking: <span className="font-mono">{ord.tracking_code}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ETA: ~{ord.eta_minutes} mins
                  </div>
                  <div className="text-[10px] text-slate-400">Dispatched: {ord.dispatched_at}</div>
                </div>

                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">
                  {ord.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Emergency Requisition Dialog Modal */}
      {orderModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-50 text-red-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Emergency Supply Requisition
                  </h3>
                  <p className="text-xs text-slate-500">{orderModalItem.name} — Apex General Hospital</p>
                </div>
              </div>
              <button onClick={() => setOrderModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current In-Hospital Available:</span>
                  <span className="font-bold text-red-700">{orderModalItem.available} Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">State Medical Logistics Hub</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-bold text-teal-700">20–25 Minutes (Expedited Courier)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Requisition Quantity Units:</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setOrderModalItem(null)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
                onClick={handleEmergencyOrder}
                disabled={actionLoading}
              >
                <Zap className="h-4 w-4" />
                {actionLoading ? 'Dispatching Order...' : 'Confirm Emergency Dispatch'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
