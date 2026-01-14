import { useState } from "react";
import { Eye, MousePointerClick, Percent, Users, Download, TrendingUp, Lightbulb } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
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

const timeRanges = ["7 days", "30 days", "90 days", "All time"];

const viewsData = [
  { date: "Mon", views: 120, clicks: 45 },
  { date: "Tue", views: 180, clicks: 67 },
  { date: "Wed", views: 150, clicks: 52 },
  { date: "Thu", views: 220, clicks: 89 },
  { date: "Fri", views: 280, clicks: 112 },
  { date: "Sat", views: 190, clicks: 78 },
  { date: "Sun", views: 240, clicks: 95 },
];

const deviceData = [
  { name: "Mobile", value: 68, color: "#8B5CF6" },
  { name: "Desktop", value: 25, color: "#EC4899" },
  { name: "Tablet", value: 7, color: "#F97316" },
];

const topLinksData = [
  { name: "My Portfolio", clicks: 234 },
  { name: "Buy Course", clicks: 156 },
  { name: "YouTube", clicks: 89 },
  { name: "Newsletter", clicks: 67 },
  { name: "Twitter", clicks: 45 },
];

const countryData = [
  { country: "United States", flag: "🇺🇸", visits: 1234, percentage: 45 },
  { country: "United Kingdom", flag: "🇬🇧", visits: 567, percentage: 21 },
  { country: "Germany", flag: "🇩🇪", visits: 345, percentage: 13 },
  { country: "France", flag: "🇫🇷", visits: 234, percentage: 9 },
  { country: "Canada", flag: "🇨🇦", visits: 189, percentage: 7 },
];

const Analytics = () => {
  const [selectedRange, setSelectedRange] = useState("7 days");

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Analytics
              </h1>
              <p className="text-muted-foreground">
                Track your profile performance and engagement.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
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

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Eye}
              label="Total Views"
              value="2,847"
              change="23%"
              positive
            />
            <StatsCard
              icon={MousePointerClick}
              label="Link Clicks"
              value="591"
              change="18%"
              positive
            />
            <StatsCard
              icon={Percent}
              label="Click Rate"
              value="20.8%"
              change="5%"
              positive
            />
            <StatsCard
              icon={Users}
              label="Unique Visitors"
              value="1,923"
              change="12%"
              positive
            />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#EC4899"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Views</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-sm text-muted-foreground">Clicks</span>
                </div>
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Device Breakdown
              </h3>
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
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {deviceData.map((device) => (
                  <div key={device.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: device.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {device.name} ({device.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Links */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Top Performing Links
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topLinksData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b7280"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="url(#gradient)"
                    radius={[0, 8, 8, 0]}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Countries */}
            <div className="bg-card rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Top Countries
              </h3>
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
                          className="h-full gradient-button rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Insights</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Top Link</p>
                <p className="font-semibold text-foreground">
                  💡 Your most clicked link is <span className="text-primary">"My Portfolio"</span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Growth</p>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  📈 Views increased <span className="text-green-600">23%</span> this week
                </p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Best Time</p>
                <p className="font-semibold text-foreground">
                  🎯 Best time to post: <span className="text-primary">2-4 PM</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
