import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";
import { isOneOf } from "./_lib/validate";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    // Use authenticated userId -- never trust req.body for identity
    const user_id = auth.userId;
    const { range } = req.body;
    if (range && !isOneOf(range, ["7 days", "30 days", "90 days", "All time"])) {
      return res.status(400).json({ error: "Invalid range" });
    }

    // Calculate date range
    let daysBack = 7;
    if (range === "30 days") daysBack = 30;
    else if (range === "90 days") daysBack = 90;
    else if (range === "All time") daysBack = 3650;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceISO = since.toISOString();

    // Fetch all events for this user within range
    const { data: events, error } = await supabaseAdmin
      .from("analytics_events")
      .select("*")
      .eq("user_id", user_id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Analytics fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch analytics" });
    }

    const allEvents = events || [];
    const views = allEvents.filter((e: any) => e.event_type === "page_view" || e.event_type === "profile_view");
    const clicks = allEvents.filter((e: any) => e.event_type === "link_click");
    const uniqueVisitors = new Set(allEvents.map((e: any) => e.visitor_id || e.ip_address).filter(Boolean)).size;

    const totalViews = views.length;
    const totalClicks = clicks.length;
    const clickRate = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

    // Views & Clicks over time (group by day)
    const dayMap: Record<string, { views: number; clicks: number }> = {};
    const dayLabels: string[] = [];
    for (let i = Math.min(daysBack, 30) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      dayMap[key] = { views: 0, clicks: 0 };
      dayLabels.push(key);
    }

    for (const e of allEvents) {
      const key = new Date(e.created_at).toISOString().split("T")[0];
      if (dayMap[key]) {
        if (e.event_type === "page_view" || e.event_type === "profile_view") {
          dayMap[key].views++;
        } else if (e.event_type === "link_click") {
          dayMap[key].clicks++;
        }
      }
    }

    const chartData = dayLabels.map((key) => {
      const d = new Date(key);
      return {
        date: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: key,
        views: dayMap[key]?.views || 0,
        clicks: dayMap[key]?.clicks || 0,
      };
    });

    // Device breakdown
    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    for (const e of allEvents) {
      const dt = e.device_type || "desktop";
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    }
    const total = allEvents.length || 1;
    const deviceData = [
      { name: "Mobile", value: Math.round((deviceCounts.mobile / total) * 100), color: "#8B5CF6" },
      { name: "Desktop", value: Math.round((deviceCounts.desktop / total) * 100), color: "#EC4899" },
      { name: "Tablet", value: Math.round((deviceCounts.tablet / total) * 100), color: "#F97316" },
    ];

    // Top countries
    const countryCounts: Record<string, number> = {};
    for (const e of allEvents) {
      if (e.country) {
        countryCounts[e.country] = (countryCounts[e.country] || 0) + 1;
      }
    }
    const countryFlags: Record<string, string> = {};
    for (const code of Object.keys(countryCounts)) {
      // Convert country code to flag emoji
      if (code.length === 2) {
        countryFlags[code] = String.fromCodePoint(
          ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
        );
      }
    }
    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, visits]) => ({
        country,
        flag: countryFlags[country] || "",
        visits,
        percentage: Math.round((visits / total) * 100),
      }));

    // Top performing links
    const linkClickCounts: Record<string, number> = {};
    for (const e of clicks) {
      if (e.link_id) {
        linkClickCounts[e.link_id] = (linkClickCounts[e.link_id] || 0) + 1;
      }
    }

    // Fetch link titles
    const linkIds = Object.keys(linkClickCounts);
    let topLinks: { name: string; clicks: number; id: string }[] = [];
    if (linkIds.length > 0) {
      const { data: linksData } = await supabaseAdmin
        .from("links")
        .select("id, title")
        .in("id", linkIds);

      const linkTitleMap = new Map((linksData || []).map((l: any) => [l.id, l.title]));

      topLinks = Object.entries(linkClickCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, clickCount]) => ({
          id,
          name: String(linkTitleMap.get(id) || "Unknown Link"),
          clicks: clickCount,
        }));
    }

    // Insights
    const insights = generateInsights(totalViews, totalClicks, clickRate, topLinks, topCountries, chartData);

    return res.status(200).json({
      totalViews,
      totalClicks,
      clickRate: `${clickRate}%`,
      uniqueVisitors,
      chartData,
      deviceData,
      topCountries,
      topLinks,
      insights,
    });
  } catch (error) {
    console.error("Analytics data error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function generateInsights(
  views: number,
  clicks: number,
  clickRate: number,
  topLinks: any[],
  topCountries: any[],
  chartData: any[],
) {
  const insights: { title: string; description: string; type: "success" | "info" | "warning" }[] = [];

  if (views === 0) {
    insights.push({
      title: "Get started",
      description: "Share your profile link to start getting views and tracking your audience.",
      type: "info",
    });
    return insights;
  }

  // Top link insight
  if (topLinks.length > 0) {
    insights.push({
      title: "Top Link",
      description: `"${topLinks[0].name}" is your best performer with ${topLinks[0].clicks} clicks.`,
      type: "success",
    });
  }

  // Click rate insight
  if (clickRate > 20) {
    insights.push({
      title: "Great engagement",
      description: `Your ${clickRate}% click rate is excellent! Your audience is highly engaged.`,
      type: "success",
    });
  } else if (clickRate > 5) {
    insights.push({
      title: "Good engagement",
      description: `Your ${clickRate}% click rate is solid. Try A/B testing link titles to improve.`,
      type: "info",
    });
  } else if (views > 10) {
    insights.push({
      title: "Low click rate",
      description: `Your ${clickRate}% click rate could improve. Try more compelling link titles and descriptions.`,
      type: "warning",
    });
  }

  // Growth insight - compare last 3 days to previous 3 days
  if (chartData.length >= 6) {
    const recent = chartData.slice(-3).reduce((s: number, d: any) => s + d.views, 0);
    const previous = chartData.slice(-6, -3).reduce((s: number, d: any) => s + d.views, 0);
    if (previous > 0) {
      const growth = Math.round(((recent - previous) / previous) * 100);
      if (growth > 0) {
        insights.push({
          title: "Growing",
          description: `Your views are up ${growth}% compared to the previous period. Keep it up!`,
          type: "success",
        });
      } else if (growth < -20) {
        insights.push({
          title: "Views declining",
          description: `Your views dropped ${Math.abs(growth)}%. Try sharing your profile on social media.`,
          type: "warning",
        });
      }
    }
  }

  // Peak day insight
  if (chartData.length > 0) {
    const peakDay = chartData.reduce((max: any, d: any) => d.views > max.views ? d : max, chartData[0]);
    if (peakDay.views > 0) {
      insights.push({
        title: "Best day",
        description: `${peakDay.date} was your best day with ${peakDay.views} views.`,
        type: "info",
      });
    }
  }

  // Top country insight
  if (topCountries.length > 0) {
    insights.push({
      title: "Top audience",
      description: `${topCountries[0].percentage}% of your visitors come from ${topCountries[0].country}.`,
      type: "info",
    });
  }

  return insights.slice(0, 4); // max 4 insights
}
