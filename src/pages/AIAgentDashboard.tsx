// AI Agent Dashboard for Link Distribution
// Creator Dashboard to manage AI-powered link sharing

import { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, Settings, 
  CheckCircle, XCircle, BarChart3, Link as LinkIcon, Loader2
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileSidebar } from '@/components/dashboard/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createLinkDistributionAgent, type Platform, type LinkToShare } from '@/lib/ai-agent/LinkDistributionAgent';

interface PlatformStatus {
  name: string;
  enabled: boolean;
  configured: boolean;
  shares_today: number;
}

interface ShareRecord {
  id: string;
  link_title: string;
  platform: string;
  success: boolean;
  shared_at: string;
  post_url?: string;
  error?: string;
}

interface LinkOption {
  id: string;
  title: string;
  url: string;
}

const AIAgentDashboard = () => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([
    { name: 'openclaw', enabled: false, configured: false, shares_today: 0 },
    { name: 'clawdbot', enabled: false, configured: false, shares_today: 0 },
    { name: 'moltbot', enabled: false, configured: false, shares_today: 0 },
  ]);
  const [recentShares, setRecentShares] = useState<ShareRecord[]>([]);
  const [analytics, setAnalytics] = useState({ total: 0, successful: 0, clicks: 0 });
  const [selectedLink, setSelectedLink] = useState<string>('');
  const [availableLinks, setAvailableLinks] = useState<LinkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's links
      const { data: links } = await supabase
        .from('links')
        .select('id, title, url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setAvailableLinks(links || []);

      // For demo purposes, set some mock analytics
      // In production, these would come from actual link_shares table
      setAnalytics({
        total: 0,
        successful: 0,
        clicks: 0,
      });

    } catch (err) {
      console.error('[v0] Dashboard load error:', err);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get enabled platforms
      const enabledPlatforms: Platform[] = platforms
        .filter(p => p.enabled && p.configured)
        .map(p => ({
          name: p.name as Platform['name'],
          apiKey: '', // Would come from secure storage in production
          enabled: true,
        }));

      if (enabledPlatforms.length === 0) {
        toast({ 
          title: 'No platforms configured', 
          description: 'Please configure at least one platform in the settings',
          variant: 'destructive' 
        });
        return;
      }

      const agent = createLinkDistributionAgent(enabledPlatforms);
      
      const linkToShare: LinkToShare = {
        id: link.id,
        url: link.url,
        title: link.title,
        description: '',
        creator_id: user.id,
      };

      const results = await agent.distributeLink(linkToShare);
      
      const successful = results.filter(r => r.success).length;
      toast({ 
        title: 'Distribution complete', 
        description: `Successfully shared to ${successful} of ${results.length} platforms` 
      });
      
      setSelectedLink('');
      loadDashboardData();

    } catch (err: any) {
      console.error('[v0] Distribution error:', err);
      toast({ title: 'Error', description: err?.message || 'Failed to distribute link', variant: 'destructive' });
    } finally {
      setDistributing(false);
    }
  };

  const togglePlatform = (platformName: string) => {
    setPlatforms(prev => prev.map(p => 
      p.name === platformName 
        ? { ...p, enabled: !p.enabled, configured: true }
        : p
    ));
  };

  const enabledCount = platforms.filter(p => p.enabled).length;

  return (
    <div className="min-h-screen bg-background flex">
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
                  Automatically share your links across platforms with AI-optimized content
                </p>
              </div>
              <Button variant="secondary" className="shrink-0">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground font-medium">Total Shares (30d)</h3>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold">{analytics.total}</p>
                <p className="text-sm text-green-600 mt-2">
                  {analytics.successful} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-muted-foreground font-medium">Click-Through Rate</h3>
                  <TrendingUp className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-3xl font-bold">
                  {analytics.total > 0 ? Math.round((analytics.clicks / analytics.total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {analytics.clicks} total clicks
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
                  <p className="text-sm text-muted-foreground mt-3">
                    Will post to {enabledCount} enabled platform{enabledCount !== 1 ? 's' : ''} with AI-optimized content
                  </p>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <h3 className="font-bold capitalize">{platform.name}</h3>
                      <button
                        onClick={() => togglePlatform(platform.name)}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          platform.enabled ? 'bg-green-500' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                            platform.enabled ? 'left-6' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {platform.enabled ? 'Active' : 'Paused'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {platform.shares_today} shares today
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
                      {share.post_url && (
                        <a
                          href={share.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-all shrink-0"
                        >
                          View Post
                        </a>
                      )}
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
