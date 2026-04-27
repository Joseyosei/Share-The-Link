import { useState, useEffect, useCallback } from "react";
import { Eye, MousePointerClick, Percent, Users, Download, Lightbulb, FileSpreadsheet, FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Loader2, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { authFetch } from "@/lib/auth-fetch";

const timeRanges = ["7 days", "30 days", "90 days", "All time"];

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  clickRate: string;
  uniqueVisitors: number;
  chartData: { date: string; fullDate: string; views: number; clicks: number }[];
  deviceData: { name: string; value: number; color: string }[];
  topCountries: { country: string; flag: string; visits: number; percentage: number }[];
  topLinks: { name: string; clicks: number; id: string }[];
  insights: { title: string; description: string; type: "success" | "info" | "warning" }[];
}

const Analytics = () => {
  const { toast } = useToast();
  const [selectedRange, setSelectedRange] = useState("7 days");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await authFetch("/api/analytics-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range: selectedRange }),
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAnalytics(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const stats = {
    totalViews: data?.totalViews ?? 0,
    linkClicks: data?.totalClicks ?? 0,
    clickRate: data?.clickRate ?? "0%",
    uniqueVisitors: data?.uniqueVisitors ?? 0,
  };

  const viewsData = data?.chartData ?? [];
  const deviceData = data?.deviceData ?? [
    { name: "Mobile", value: 0, color: "#8B5CF6" },
    { name: "Desktop", value: 0, color: "#EC4899" },
    { name: "Tablet", value: 0, color: "#F97316" },
  ];
  const topLinksData = data?.topLinks ?? [];
  const countryData = data?.topCountries ?? [];
  const insights = data?.insights ?? [];

  const exportToCSV = () => {
    const headers = ["Date", "Views", "Clicks"];
    const csvData = viewsData.map((row) => `${row.fullDate || row.date},${row.views},${row.clicks}`);
    const csvContent = [headers.join(","), ...csvData].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_${selectedRange.replace(" ", "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful!", description: "Your analytics data has been downloaded as CSV." });
  };

  const exportToExcel = () => {
    const summaryData = [
      `Total Views,${stats.totalViews}`,
      `Link Clicks,${stats.linkClicks}`,
      `Click Rate,${stats.clickRate}`,
      `Unique Visitors,${stats.uniqueVisitors}`,
      "",
      "Date,Views,Clicks",
      ...viewsData.map((row) => `${row.fullDate || row.date},${row.views},${row.clicks}`),
    ];
    
    const csvContent = summaryData.join("\n");
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics_${selectedRange.replace(" ", "_")}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export successful!", description: "Your analytics data has been downloaded for Excel." });
  };

  const copyForGoogleSheets = () => {
    const headers = "Date\tViews\tClicks";
    const tsvData = viewsData.map((row) => `${row.fullDate || row.date}\t${row.views}\t${row.clicks}`);
    const tsvContent = [headers, ...tsvData].join("\n");
    
    navigator.clipboard.writeText(tsvContent).then(() => {
      toast({ title: "Copied to clipboard!", description: "Paste this data directly into Google Sheets." });
    });
  };

  const InsightIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted liquid-glass-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                Analytics
              </h1>
              <p className="text-muted-foreground">
                Track your profile performance and engagement.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="gap-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing" : "Refresh"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export for Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyForGoogleSheets} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Copy for Google Sheets
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2 mb-8">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedRange === range
                    ? "gradient-button text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Eye} label="Total Views" value={stats.totalViews} color="text-primary" bgColor="bg-primary/10" />
                <StatCard icon={MousePointerClick} label="Link Clicks" value={stats.linkClicks} color="text-pink-500" bgColor="bg-pink-500/10" />
                <StatCard icon={Percent} label="Click Rate" value={stats.clickRate} color="text-amber-500" bgColor="bg-amber-500/10" />
                <StatCard icon={Users} label="Unique Visitors" value={stats.uniqueVisitors} color="text-emerald-500" bgColor="bg-emerald-500/10" />
              </div>

              {/* Charts Grid */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Views & Clicks Chart */}
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Views & Clicks Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="clicks" stroke="#EC4899" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
                      <span className="text-sm text-muted-foreground">Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#EC4899" }} />
                      <span className="text-sm text-muted-foreground">Clicks</span>
                    </div>
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Device Breakdown
                  </h3>
                  {deviceData.some((d) => d.value > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={deviceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {deviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "12px",
                              color: "hsl(var(--foreground))",
                            }}
                            formatter={(value) => `${value}%`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-6 mt-4">
                        {deviceData.map((device) => (
                          <div key={device.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }} />
                            <span className="text-sm text-muted-foreground">
                              {device.name} ({device.value}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No visitor data yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Share your profile to start tracking
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Performing Links */}
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Top Performing Links
                  </h3>
                  {topLinksData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topLinksData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="hsl(var(--muted-foreground))"
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Bar dataKey="clicks" fill="url(#gradient)" radius={[0, 8, 8, 0]} />
                        <defs>
                          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MousePointerClick className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No link clicks yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add links to your profile to track performance
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Countries */}
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Top Countries
                  </h3>
                  {countryData.length > 0 ? (
                    <div className="space-y-4">
                      {countryData.map((country) => (
                        <div key={country.country} className="flex items-center gap-4">
                          <span className="text-2xl">{country.flag}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">
                                {country.country}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {country.visits.toLocaleString()} ({country.percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${country.percentage}%`,
                                  background: "linear-gradient(to right, #8B5CF6, #EC4899)",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <span className="text-3xl" role="img" aria-label="Globe">{'🌍'}</span>
                      </div>
                      <p className="text-muted-foreground font-medium">No geographic data yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visitors will appear here once you get traffic
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-card rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-foreground">Insights</h3>
                </div>
                {insights.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {insights.map((insight, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border ${
                          insight.type === "success"
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                            : insight.type === "warning"
                              ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                              : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <InsightIcon type={insight.type} />
                          <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-muted text-center">
                    <p className="text-muted-foreground mb-2 font-medium">
                      Start sharing your profile to unlock insights!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Once you get traffic, we will show you personalized recommendations to grow your audience.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
}

const StatCard = ({ icon: Icon, label, value, color, bgColor }: StatCardProps) => (
  <div className="bg-card rounded-2xl p-5 shadow-lg">
    <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export default Analytics;
