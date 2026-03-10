// lib/ai-agent/LinkDistributionAgent.ts
// AI Agent for Automatic Link Sharing
// Adapted for Share The Link platform

import { supabase } from '@/integrations/supabase/client';

export type PlatformName = 'openclaw' | 'clawdbot' | 'moltbot' | 'twitter' | 'linkedin' | 'facebook';

export interface Platform {
  name: PlatformName;
  apiKey: string;
  enabled: boolean;
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
        // Generate AI-optimized content for this platform
        const content = await this.generatePlatformContent(link, platform.name);

        // Share to the platform
        const result = await this.shareToPlatform(
          platform,
          link,
          content
        );

        results.push(result);

        // Log the share
        await this.logShare(link.id, platform.name, result);

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
   * Generate platform-optimized content (simplified version without external AI)
   * In production, this could be enhanced with AI SDK
   */
  private generatePlatformContent(
    link: LinkToShare,
    platform: string
  ): string {
    const hashtags = link.tags?.slice(0, 3).map(t => `#${t}`).join(' ') || '';
    
    const templates: Record<string, string> = {
      openclaw: `${link.title}\n\n${link.description?.slice(0, 150) || ''}\n\n${link.url} ${hashtags}`,
      clawdbot: `Check this out: ${link.title}\n${link.description?.slice(0, 200) || ''}\n${link.url}`,
      moltbot: `${link.title}\n\n${link.description?.slice(0, 250) || ''}\n\nLink: ${link.url} ${hashtags}`,
      twitter: `${link.title.slice(0, 100)}\n\n${link.url} ${hashtags}`.slice(0, 280),
      linkedin: `${link.title}\n\n${link.description || ''}\n\nRead more: ${link.url}`,
      facebook: `${link.title}\n\n${link.description || ''}\n\n${link.url}`,
    };
    
    return templates[platform] || `${link.title}\n${link.url}`;
  }

  /**
   * Share content to specific platform
   */
  private async shareToPlatform(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    switch (platform.name) {
      case 'openclaw':
        return await this.shareToOpenClaw(platform, link, content);
      
      case 'clawdbot':
        return await this.shareToClawdBot(platform, link, content);
      
      case 'moltbot':
        return await this.shareToMoltBot(platform, link, content);
      
      case 'twitter':
        return await this.shareToTwitter(platform, link, content);
      
      case 'linkedin':
        return await this.shareToLinkedIn(platform, link, content);
      
      case 'facebook':
        return await this.shareToFacebook(platform, link, content);
      
      default:
        throw new Error(`Unknown platform: ${platform.name}`);
    }
  }

  /**
   * OpenClaw integration
   */
  private async shareToOpenClaw(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://api.openclaw.io/v1/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          url: link.url,
          title: link.title,
          tags: link.tags,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        platform: 'openclaw',
        success: true,
        post_id: data.id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'openclaw',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * ClawdBot integration
   */
  private async shareToClawdBot(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://api.clawdbot.com/share', {
        method: 'POST',
        headers: {
          'X-API-Key': platform.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          link: link.url,
          metadata: {
            title: link.title,
            description: link.description,
            image: link.image_url,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ClawdBot API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        platform: 'clawdbot',
        success: true,
        post_id: data.post_id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'clawdbot',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * MoltBot integration
   */
  private async shareToMoltBot(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      const response = await fetch('https://moltbot.ai/api/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${platform.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          url: link.url,
          title: link.title,
          image_url: link.image_url,
          tags: link.tags,
        }),
      });

      if (!response.ok) {
        throw new Error(`MoltBot API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        platform: 'moltbot',
        success: true,
        post_id: data.broadcast_id,
        ai_generated_content: content,
      };
    } catch (error) {
      return {
        platform: 'moltbot',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Twitter/X integration
   */
  private async shareToTwitter(
    platform: Platform,
    link: LinkToShare,
    content: string
  ): Promise<ShareResult> {
    try {
      // Using Twitter API v2
      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${platform.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        platform: 'twitter',
        success: true,
        post_id: data.data.id,
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
          author: `urn:li:person:${platform.apiKey}`, // Would need person ID
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: 'ARTICLE',
              media: [{
                status: 'READY',
                originalUrl: link.url,
              }],
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
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            link: link.url,
            access_token: platform.apiKey,
          }),
        }
      );

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
   * Log share activity to database
   */
  private async logShare(
    linkId: string,
    platform: string,
    result: ShareResult
  ): Promise<void> {
    try {
      await supabase.from('link_shares').insert({
        link_id: linkId,
        platform: platform,
        success: result.success,
        post_id: result.post_id,
        error: result.error,
        ai_content: result.ai_generated_content,
        shared_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[v0] Failed to log share:', err);
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
      
      // Delay between links to avoid rate limits
      await this.delay(5000);
    }

    return results;
  }

  /**
   * Schedule automatic sharing
   */
  async scheduleDistribution(
    linkId: string,
    scheduledTime: Date
  ): Promise<void> {
    try {
      await supabase.from('scheduled_shares').insert({
        link_id: linkId,
        scheduled_for: scheduledTime.toISOString(),
        status: 'pending',
      });
    } catch (err) {
      console.error('[v0] Failed to schedule distribution:', err);
    }
  }
}

// Export singleton instance
export const createLinkDistributionAgent = (platforms: Platform[]) => {
  return new LinkDistributionAgent(platforms);
};
