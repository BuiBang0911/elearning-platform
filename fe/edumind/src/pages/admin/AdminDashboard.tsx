import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  UserPlus,
  GraduationCap,
  ArrowUpRight,
  ArrowDownRight,
  Brain
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import AdminApi, { type AdminDashboardStats } from "../../api/admin.api";
import { Card } from "../../components/ui/card";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await AdminApi.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return <FullPageLoader isFullPage={false} />;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const summaryCards = [
    { label: "Total Students", value: stats.totalStudents, icon: GraduationCap, color: "bg-blue-500", trend: stats.studentGrowth },
    { label: "Total Instructors", value: stats.totalInstructors, icon: UserPlus, color: "bg-purple-500", trend: stats.instructorGrowth },
    { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "bg-orange-500", trend: stats.courseGrowth },
    { label: "Total Enrollments", value: stats.totalEnrollments, icon: Users, color: "bg-green-500", trend: stats.enrollmentGrowth },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-500">Welcome back, administrator.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <Card key={i} className="p-6 relative overflow-hidden group border-none shadow-sm hover:shadow-xl transition-all duration-300">
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.1] transition-opacity duration-500`} />
            <div className="flex items-start justify-between">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg shadow-blue-500/10`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${card.trend >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                {card.trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {card.trend}%
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">{card.label}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{card.value.toLocaleString()}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-8 border-none shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Enrollment Growth</h3>
              <p className="text-slate-500 text-sm">Activity across the last 6 months</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.enrollmentTrends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Categories Chart */}
        <Card className="p-8 border-none shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Category Distribution</h3>
          <p className="text-slate-500 text-sm mb-8">Courses by subject area</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="courseCount"
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {stats.categoryDistribution.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-slate-600">{cat.categoryName}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{cat.courseCount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Performance Section for Admin */}
      <Card className="p-8 border-none shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Assistant Performance (Global)
            </h3>
            <p className="text-slate-500 text-sm">Real-time metrics for platform-wide AI interactions</p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-0.5">Total Queries</span>
              <span className="text-lg font-bold text-slate-800">{stats.aiUsage.totalQuestions.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-0.5">Avg Response</span>
              <span className="text-lg font-bold text-slate-800">{stats.aiUsage.avgResponseTimeSeconds}s</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-600">Student Engagement Rate</span>
              <span className="text-sm font-bold text-blue-600">{stats.aiUsage.engagementRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.aiUsage.engagementRate}%` }} />
            </div>
            <p className="text-xs text-slate-400">Percentage of enrollments with active AI chat interactions.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-600">Avg Conversation Depth</span>
              <span className="text-sm font-bold text-green-600">{stats.aiUsage.avgConversationDepth} msgs/session</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (stats.aiUsage.avgConversationDepth / 10) * 100)}%` }} />
            </div>
            <p className="text-xs text-slate-400">Average number of user questions per chat session.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-600">Active AI Users Ratio</span>
              <span className="text-sm font-bold text-purple-600">{stats.aiUsage.activeUsersRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.aiUsage.activeUsersRatio}%` }} />
            </div>
            <p className="text-xs text-slate-400">Percentage of registered students who have used the AI assistant.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
