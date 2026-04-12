import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Card } from "../../components/ui/card";
import { 
  Users, 
  Star, 
  Brain, 
  TrendingUp,
  MessageSquare,
  History
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { DashboardApi, type CourseDetailStats } from "../../api/Dashboard.api";
import { format } from "date-fns";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";

interface CourseAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  courseTitle: string;
}

export default function CourseAnalyticsDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
}: CourseAnalyticsDialogProps) {
  const [stats, setStats] = useState<CourseDetailStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && courseId) {
      const fetchStats = async () => {
        try {
          setLoading(true);
          const data = await DashboardApi.getCourseDetailStats(courseId);
          setStats(data);
        } catch (error) {
          console.error("Error fetching course analytics:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [open, courseId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Analytics: {courseTitle}
          </DialogTitle>
          <DialogDescription>
            Detailed performance breakdown for this course.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
             <FullPageLoader />
          </div>
        ) : stats ? (
          <div className="space-y-6 pt-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center gap-4 border-none bg-blue-50 shadow-sm">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase">Total Students</p>
                  <p className="text-xl font-bold text-slate-800">{stats.totalStudents}</p>
                </div>
              </Card>

              <Card className="p-4 flex items-center gap-4 border-none bg-yellow-50 shadow-sm">
                <div className="p-2 bg-yellow-500 rounded-lg text-white">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-yellow-600 uppercase">Avg Rating</p>
                  <p className="text-xl font-bold text-slate-800">{stats.averageRating}</p>
                </div>
              </Card>

              <Card className="p-4 flex items-center gap-4 border-none bg-purple-50 shadow-sm">
                <div className="p-2 bg-purple-500 rounded-lg text-white">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase">AI Queries</p>
                  <p className="text-xl font-bold text-slate-800">{stats.aiQuestionsCount}</p>
                </div>
              </Card>
            </div>

            {/* Enrollment Growth Chart */}
            <Card className="p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Monthly Enrollment Trend
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.enrollmentTrend}>
                    <defs>
                      <linearGradient id="colorEnrollCourse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorEnrollCourse)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent Reviews for this course */}
            <Card className="p-6 border border-slate-100 shadow-sm">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  Latest Feedback
               </h4>
               <div className="space-y-4">
                  {stats.recentReviews.length > 0 ? (
                    stats.recentReviews.map((review, i) => (
                      <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                              {review.studentName.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-slate-800">{review.studentName}</p>
                              <p className="text-[10px] text-slate-400">{format(new Date(review.date), "MMM dd, yyyy")}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                           <Star className="w-3 h-3 fill-current" />
                           <span className="text-xs font-bold">{review.rating}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                       <History className="w-8 h-8 mx-auto opacity-20" />
                       <p className="text-sm">No reviews yet for this specific course</p>
                    </div>
                  )}
               </div>
            </Card>
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500">
             Could not load analytics for this course.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
