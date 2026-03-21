// lib/ai-agent/LinkDistributionAgent.ts
// AI Agent for Automatic Link Sharing via webhooks (Make.com / n8n compatible)

import { supabase } from '@/integrations/supabase/client';

export type PlatformName = 'twitter' | 'linkedin' | 'facebook' | 'webhook';

export interface Platform {
  name: PlatformName;
  apiKey: string;
  enabled: boolean;
  webhookUrl?: string;
}

export interface LinkToShare {
  id: string;
  url: string;
  title: string;
  description: string;
  creator_id: string;
  tags?: string[];
  image_url?: string;
}

export interface ShareResult {
  platform: string;
  success: boolean;
  post_id?: string;
  error?: string;
  ai_generated_content?: string;
}

export class LinkDistributionAgent {
  private platforms: Platform[];

  constructor(platforms: Platform[]) {
    this.platforms = platforms.filter(p => p.enabled);
  }

  /**
   * Main method: Distribute a link across all enabled platforms
   */
  async distributeLink(link: LinkToShare): Promise<ShareResult[]> {
    const results: ShareResult[] = [];

    for (const platform of this.platforms) {
      try {
        const content = this.generatePlatformContent(link, platform.name);
        const result = await this.shareToPlatform(platform, link, content);
        results.push(result);

        // Rate limiting - wait between posts
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to share to ${platform.name}:`, error);
        results.push({
          platform: platform.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Generate platform-optimized content
   */
  private generatePlatformContent(link: LinkToShare, platform: string): string {
    const hashtags = link.tags?.slice(0, 3).map(t => `#${t}`).join(' ') || '';

    const templates: Record<string, string> = {
      twitter: `${link.title.slice(0, 100)}\n\n${link.url} ${hashtags}`.slice(0, 280),
      linkedin: `${link.title}\n\n${link.description || ''}\n\nRead more: ${link.url}`,
      facebook: `${link.title}\n\n${link.description || ''}\n\n${link.url}`,
      webhook: JSON.stringify({
        title: link.title,
        description: link.description,
        url: link.url,
        tags: link.tags,
        image_url: link.image_url,
      }),
    };

    return templates[platform] || `${link.title}\n${link.url}`;
  }

  /**
   * Share content to specific platform via webhook
   */
  private async shareToPlatform(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    // All platforms go through webhook for Make.com/n8n automation
    if (platform.webhookUrl) {
      return await this.shareViaWebhook(platform, link, content);
    }

    // Direct API calls for platforms with API keys
    switch (platform.name) {
      case 'twitter':
        return await this.shareToTwitter(platform, link, content);
      case 'linkedin':
        return await this.shareToLinkedIn(platform, link, content);
      case 'facebook':
        return await this.shareToFacebook(platform, link, content);
      case 'webhook':
        return {
          platform: 'webhook',
          success: false,
          error: 'No webhook URL configured. Add your Make.com or n8n webhook URL.',
        };
      default:
        throw new Error(`Unknown platform: ${platform.name}`);
    }
  }

  /**
   * Share via webhook (Make.com / n8n compatible)
   * Sends a standardized payload that automation tools can route to any platform
   */
  private async shareViaWebhook(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch(platform.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.name,
          link: {
            id: link.id,
            url: link.url,
            title: link.title,
            description: link.description,
            tags: link.tags,
            image_url: link.image_url,
          },
          content,
          creator_id: link.creator_id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
      }

      let postId: string | undefined;
      try {
        const data = await response.json();
        postId = data.post_id || data.id;
      } catch {
        // Webhook may not return JSON
      }

      return {
        platform: platform.name,
        success: true,
        post_id: postId,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: platform.name,
        success: false,
        error: error instanceof Error ? error.message : 'Webhook request failed',
      };
    }
  }

  /**
   * Twitter/X integration
   */
  private async shareToTwitter(
    platform: Platform,
    _link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        platform: 'twitter',
        success: true,
        post_id: data.data?.id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'twitter',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * LinkedIn integration
   */
  private async shareToLinkedIn(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.apiKey}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: `urn:li:person:me`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'ARTICLE',
              media: [{ status: 'READY', originalUrl: link.url }],
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        platform: 'linkedin',
        success: true,
        post_id: data.id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'linkedin',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Facebook integration
   */
  private async shareToFacebook(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://graph.facebook.com/v18.0/me/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          link: link.url,
          access_token: platform.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        platform: 'facebook',
        success: true,
        post_id: data.id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'facebook',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch distribute multiple links
   */
  async distributeBatch(links: LinkToShare[]): Promise<Map<string, ShareResult[]>> {
    const results = new Map<string, ShareResult[]>();

    for (const link of links) {
      const shareResults = await this.distributeLink(link);
      results.set(link.id, shareResults);
      await this.delay(5000);
    }

    return results;
  }
}

// Export factory
export const createLinkDistributionAgent = (platforms: Platform[]) => {
  return new LinkDistributionAgent(platforms);
};
