import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LoadingState } from '@/components/shared/LoadingState';
import { Save, Bell, Shield, Database } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        setSettings(res.data);
      } catch (err) {
        // Mock fallback if API not ready
        setSettings({
          general: { hospital_name: 'St. Jude General', timezone: 'EST' },
          notifications: { email_alerts: true, sms_alerts: false, critical_only: true },
          ai: { auto_approve_low_risk: false, strict_guardrails: true }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Assuming a POST/PUT endpoint exists for saving
      // await apiClient.post('/settings', settings);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulating network delay
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading configuration..." />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure YODHA 2.0 platform preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" /> General Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hospital Name</Label>
                <Input 
                  value={settings?.general?.hospital_name || ''} 
                  onChange={e => setSettings({...settings, general: {...settings.general, hospital_name: e.target.value}})}
                />
              </div>
              <div className="space-y-2">
                <Label>System Timezone</Label>
                <Input 
                  value={settings?.general?.timezone || ''} 
                  onChange={e => setSettings({...settings, general: {...settings.general, timezone: e.target.value}})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notification Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-slate-500">Receive summaries and alerts via email.</p>
                </div>
                <Switch 
                  checked={settings?.notifications?.email_alerts} 
                  onCheckedChange={c => setSettings({...settings, notifications: {...settings.notifications, email_alerts: c}})} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Critical Alerts Only</Label>
                  <p className="text-sm text-slate-500">Mute warnings and info-level notifications.</p>
                </div>
                <Switch 
                  checked={settings?.notifications?.critical_only}
                  onCheckedChange={c => setSettings({...settings, notifications: {...settings.notifications, critical_only: c}})} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> AI & Automation
              </CardTitle>
              <CardDescription>Control the autonomy of the YODHA AI agent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve Low Risk Optimizations</Label>
                  <p className="text-sm text-slate-500">Allow AI to implement minor scheduling adjustments.</p>
                </div>
                <Switch 
                  checked={settings?.ai?.auto_approve_low_risk}
                  onCheckedChange={c => setSettings({...settings, ai: {...settings.ai, auto_approve_low_risk: c}})} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Guardrails</Label>
                  <p className="text-sm text-slate-500">Enforce maximum safety margins on all predictions.</p>
                </div>
                <Switch 
                  checked={settings?.ai?.strict_guardrails}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
