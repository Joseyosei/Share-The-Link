// AI Agent Dashboard for Link Distribution
// Creator Dashboard to manage AI-powered link sharing via Make.com / n8n webhooks

import { useState, useEffect } from 'react';
import {
  Zap, TrendingUp, Settings, Copy, Check,
  CheckCircle, XCircle, BarChart3, Link as LinkIcon, Loader2, Webhook, Globe,
  Download, Key, ExternalLink, BookOpen, RefreshCw
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileSidebar } from '@/components/dashboard/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PlatformStatus {
  name: string;
  label: string;
  enabled: boolean;
  webhookUrl: string;
}

interface ShareRecord {
  id: string;
  link_title: string;
  platform: string;
  success: boolean;
  shared_at: string;
  error?: string;
}

interface LinkOption {
  id: string;
  title: string;
  url: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  webhook: 'Custom Webhook (Make.com / n8n)',
};

const AIAgentDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([
    { name: 'twitter', label: 'Twitter / X', enabled: false, webhookUrl: '' },
    { name: 'linkedin', label: 'LinkedIn', enabled: false, webhookUrl: '' },
    { name: 'facebook', label: 'Facebook', enabled: false, webhookUrl: '' },
    { name: 'webhook', label: 'Custom Webhook', enabled: false, webhookUrl: '' },
  ]);
  const [recentShares, setRecentShares] = useState<ShareRecord[]>([]);
  const [selectedLink, setSelectedLink] = useState<string>('');
  const [availableLinks, setAvailableLinks] = useState<LinkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedField, setCopiedField] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getAuthToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (!supaUser) return;

      // Load user's links
      const { data: links } = await supabase
        .from('links')
        .select('id, title, url')
        .eq('user_id', supaUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setAvailableLinks(links || []);

      // Load webhook settings from profile (server-side)
      const { data: profile } = await supabase
        .from('profiles')
        .select('api_key, webhook_settings')
        .eq('user_id', supaUser.id)
        .single();

      if (profile?.api_key) {
        setApiKey(profile.api_key as string);
      }

      const webhookSettings = (profile?.webhook_settings as any) || {};
      setPlatforms(prev => prev.map(p => {
        const saved = webhookSettings[p.name];
        return saved ? { ...p, enabled: saved.enabled || false, webhookUrl: saved.webhookUrl || '' } : p;
      }));
    } catch (err) {
      console.error('Dashboard load error:', err);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePlatformSettings = async () => {
    setSavingSettings(true);
    try {
      const token = await getAuthToken();
      const platformsObj: Record<string, { enabled: boolean; webhookUrl: string }> = {};
      platforms.forEach(p => {
        platformsObj[p.name] = { enabled: p.enabled, webhookUrl: p.webhookUrl };
      });

      const res = await fetch('/api/ai-agent?action=save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platforms: platformsObj }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      toast({ title: 'Settings saved', description: 'Webhook settings saved to your profile.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/ai-agent?action=generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate key');

      setApiKey(data.api_key);
      toast({ title: 'API Key generated', description: 'Copy this key and paste it into your Make.com or n8n workflow.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to generate API key', variant: 'destructive' });
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleDistributeLink = async () => {
    if (!selectedLink) {
      toast({ title: 'Select a link', description: 'Please select a link to distribute', variant: 'destructive' });
      return;
    }

    setDistributing(true);
    try {
      const link = availableLinks.find(l => l.id === selectedLink);
      if (!link) throw new Error('Link not found');

      const token = await getAuthToken();
      const res = await fetch('/api/ai-agent?action=distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ link_id: link.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Distribution failed');

      // Add to recent shares
      const newShares: ShareRecord[] = (data.results || []).map((r: any) => ({
        id: `${Date.now()}-${r.platform}`,
        link_title: link.title,
        platform: PLATFORM_LABELS[r.platform] || r.platform,
        success: r.success,
        shared_at: new Date().toISOString(),
        error: r.error,
      }));
      setRecentShares(prev => [...newShares, ...prev]);

      toast({
        title: 'Distribution complete',
        description: `Shared to ${data.distributed} of ${data.total} platform${data.total !== 1 ? 's' : ''}`,
      });
      setSelectedLink('');
    } catch (err: any) {
      console.error('Distribution error:', err);
      toast({ title: 'Error', description: err?.message || 'Failed to distribute link', variant: 'destructive' });
    } finally {
      setDistributing(false);
    }
  };

  const togglePlatform = (platformName: string) => {
    setPlatforms(prev => prev.map(p =>
      p.name === platformName ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const updateWebhookUrl = (platformName: string, url: string) => {
    setPlatforms(prev => prev.map(p =>
      p.name === platformName ? { ...p, webhookUrl: url } : p
    ));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const downloadBlueprint = (type: 'make' | 'n8n') => {
    const filename = type === 'make'
      ? 'make-sharethelink-agent.json'
      : 'n8n-sharethelink-agent.json';
    const link = document.createElement('a');
    link.href = `/blueprints/${filename}`;
    link.download = filename;
    link.click();
  };

  const enabledCount = platforms.filter(p => p.enabled).length;
  const successfulShares = recentShares.filter(s => s.success).length;
  const webhookEndpoint = 'https://sharethelink.app/api/ai-agent?action=webhook-trigger';

  return (
    <div className="min-h-screen bg-background liquid-glass-muted flex">
      <Sidebar />
      <MobileSidebar />

      <main className="flex-1 p-4 md:p-8 md:ml-64">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-8 h-8" />
                  <h1 className="text-2xl md:text-3xl font-bold">AI Distribution Agent</h1>
                </div>
                <p className="text-purple-100">
                  Automate link sharing across platforms with Make.com or n8n workflows.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowSetupGuide(!showSetupGuide); setShowSettings(false); }}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {showSetupGuide ? 'Close Guide' : 'Setup Guide'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowSettings(!showSettings); setShowSetupGuide(false); }}>
                  <Settings className="w-4 h-4 mr-2" />
                  {showSettings ? 'Close' : 'Settings'}
                </Button>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          {showSetupGuide && (
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Setup Guide - Connect Make.com or n8n
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: API Key */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">1</span>
                    Generate Your API Key
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your API key authenticates Make.com/n8n with your Share The Link account.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {apiKey ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={apiKey}
                          readOnly
                          className="flex-1 font-mono text-xs"
                        />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiKey, 'apiKey')}>
                          {copiedField === 'apiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600">No API key generated yet.</p>
                    )}
                    <Button onClick={generateApiKey} disabled={generatingKey} size="sm">
                      {generatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                      {apiKey ? 'Regenerate' : 'Generate Key'}
                    </Button>
                  </div>
                </div>

                {/* Step 2: Webhook Endpoint */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">2</span>
                    Your API Endpoint
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use this endpoint in Make.com HTTP modules or n8n HTTP Request nodes to fetch your links or trigger distribution.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={webhookEndpoint}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(webhookEndpoint, 'endpoint')}>
                      {copiedField === 'endpoint' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-bold">Available Actions (POST body):</p>
                    <div className="space-y-1 text-xs font-mono">
                      <p className="text-green-600">{"{ \"api_key\": \"stl_...\", \"action\": \"list-links\" }"}</p>
                      <p className="text-blue-600">{"{ \"api_key\": \"stl_...\", \"action\": \"distribute\", \"link_id\": \"...\" }"}</p>
                      <p className="text-purple-600">{"{ \"api_key\": \"stl_...\", \"action\": \"get-profile\" }"}</p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Import Blueprint */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">3</span>
                    Import Workflow Blueprint
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Download a pre-built workflow blueprint and import it into your automation tool.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Make.com */}
                    <div className="border-2 rounded-xl p-4 space-y-3 hover:border-purple-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold">Make.com</h4>
                          <p className="text-xs text-muted-foreground">Scenario Blueprint</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full" variant="outline" onClick={() => downloadBlueprint('make')}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Blueprint
                      </Button>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Go to Make.com &gt; Create Scenario</li>
                        <li>Click (...) &gt; Import Blueprint</li>
                        <li>Upload the downloaded JSON file</li>
                        <li>Connect your social media accounts</li>
                        <li>Copy the webhook URL from module #1</li>
                        <li>Paste it in Settings below as the webhook URL</li>
                      </ol>
                    </div>

                    {/* n8n */}
                    <div className="border-2 rounded-xl p-4 space-y-3 hover:border-orange-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <Webhook className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold">n8n</h4>
                          <p className="text-xs text-muted-foreground">Workflow JSON</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full" variant="outline" onClick={() => downloadBlueprint('n8n')}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Workflow
                      </Button>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Go to n8n &gt; Import from File</li>
                        <li>Upload the downloaded JSON file</li>
                        <li>Connect your social media credentials</li>
                        <li>Activate the workflow</li>
                        <li>Copy the webhook URL from the trigger node</li>
                        <li>Paste it in Settings below as the webhook URL</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Step 4: Configure Webhooks */}
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm">4</span>
                    Configure Webhook URLs
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    After importing the blueprint, paste the webhook URLs from Make.com/n8n into the Settings panel.
                    Then click "Distribute Now" to share links across all connected platforms.
                  </p>
                  <Button onClick={() => { setShowSettings(true); setShowSetupGuide(false); }}>
                    <Settings className="w-4 h-4 mr-2" />
                    Open Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <Card className="border-2 border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-purple-600" />
                  Webhook Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Paste your Make.com or n8n webhook URLs below. When you distribute a link, it sends data to these webhooks which then post to your social accounts.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key Section */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-sm">API Key</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={generateApiKey} disabled={generatingKey}>
                      {generatingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </Button>
                  </div>
                  {apiKey ? (
                    <div className="flex gap-2">
                      <Input value={apiKey} readOnly className="flex-1 font-mono text-xs" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiKey, 'settingsApiKey')}>
                        {copiedField === 'settingsApiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={generateApiKey} disabled={generatingKey}>
                      <Key className="w-4 h-4 mr-2" />
                      Generate API Key
                    </Button>
                  )}
                </div>

                {/* Platform Webhook URLs */}
                {platforms.map(platform => (
                  <div key={platform.name} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <button
                        onClick={() => togglePlatform(platform.name)}
                        className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${
                          platform.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                          platform.enabled ? 'left-[18px]' : 'left-0.5'
                        }`} />
                      </button>
                      <span className="font-medium text-sm">{platform.label}</span>
                    </div>
                    <Input
                      placeholder="https://hook.us1.make.com/... or https://your-n8n.com/webhook/..."
                      value={platform.webhookUrl}
                      onChange={(e) => updateWebhookUrl(platform.name, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                ))}
                <Button onClick={savePlatformSettings} disabled={savingSettings} className="gradient-button text-primary-foreground">
                  {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground font-medium">Total Shares</h3>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold">{recentShares.length}</p>
                <p className="text-sm text-green-600 mt-2">
                  {successfulShares} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground font-medium">Success Rate</h3>
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-3xl font-bold">
                  {recentShares.length > 0 ? Math.round((successfulShares / recentShares.length) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  this session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground font-medium">Active Platforms</h3>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold">{enabledCount}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  of {platforms.length} available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Distribute */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Quick Distribute
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select
                      value={selectedLink}
                      onChange={(e) => setSelectedLink(e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-border rounded-lg bg-background focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select a link to share...</option>
                      {availableLinks.map(link => (
                        <option key={link.id} value={link.id}>
                          {link.title} ({link.url})
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleDistributeLink}
                      disabled={!selectedLink || distributing || enabledCount === 0}
                      className="gradient-button text-primary-foreground px-8"
                    >
                      {distributing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Distributing...
                        </>
                      ) : (
                        'Distribute Now'
                      )}
                    </Button>
                  </div>
                  {enabledCount === 0 && (
                    <p className="text-sm text-amber-600 mt-3">
                      No platforms enabled. Click <button className="underline font-medium" onClick={() => setShowSetupGuide(true)}>Setup Guide</button> to get started.
                    </p>
                  )}
                  {enabledCount > 0 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Will post to {enabledCount} enabled platform{enabledCount !== 1 ? 's' : ''} via webhook
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Platform Status */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map(platform => (
                  <div
                    key={platform.name}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      platform.enabled
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-bold">{platform.label}</h3>
                      </div>
                      <Badge variant={platform.enabled ? "default" : "secondary"}>
                        {platform.enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {platform.webhookUrl || 'No webhook URL configured'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Shares */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Shares</CardTitle>
            </CardHeader>
            <CardContent>
              {recentShares.length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No shares yet. Select a link above to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentShares.map(share => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {share.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{share.link_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {share.platform} - {new Date(share.shared_at).toLocaleString()}
                          </p>
                          {share.error && (
                            <p className="text-xs text-red-600 mt-1">{share.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AIAgentDashboard;
