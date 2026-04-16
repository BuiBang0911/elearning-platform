import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
	Brain,
	BookOpen,
	Users,
	TrendingUp,
	FileText,
	BarChart3,
	Settings,
	Star,
	Clock,
	MessageSquare,
	ArrowUpRight,
	Wallet,
	DollarSign,
	ArrowDownRight as ArrowDown,
} from "lucide-react";
import { getCourseLevelName, type CourseResponse, type CourseResponseInstructorDashboard } from "../interfaces/Course";
import HeaderInstructor from "../components/Header/HeaderInstructor";
import CreateNewCourse from "../components/Instructor/CreateNewCourse";
import CourseApi from "../api/Course.api";
import EditCourse from "../components/Instructor/EditCourse";
import LearningMaterial from "../components/Instructor/LearningMaterial/LearningMaterial";
import StudentTabContent from "../components/Instructor/StudentTabContent";
import { DashboardApi, type InstructorDashboardStats } from "../api/Dashboard.api";
import WalletApi from "../api/Wallet.api";
import type { TeacherRevenueStats } from "../interfaces/Payment";
import AiAssistant from "../components/AiAssistant/AiAssistant";
import FullPageLoader from "../components/PostLoading/FullPageLoader";
import CourseAnalyticsDialog from "../components/Instructor/CourseAnalyticsDialog";
import WithdrawalDialog from "../components/Instructor/WithdrawalDialog";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function InstructorDashboard() {
	const queryClient = useQueryClient();

	const [editCourseOpen, setEditCourseOpen] = useState(false);
	const [selectedCourse, setSelectedCourse] = useState<CourseResponseInstructorDashboard | null>(null);
	const [analyticsOpen, setAnalyticsOpen] = useState(false);
	const [analyticsCourse, setAnalyticsCourse] = useState<{ id: number, title: string } | null>(null);
	const [createCourseOpen, setCreateCourseOpen] = useState(false);

	const handleOpenAnalytics = (courseId: number, courseTitle: string) => {
		setAnalyticsCourse({ id: courseId, title: courseTitle });
		setAnalyticsOpen(true);
	};

	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ["instructor", "courses"],
		queryFn: CourseApi.getAllInstructorDashboard,
	});

	const { data: stats = null, isLoading: statsLoading } = useQuery({
		queryKey: ["instructor", "stats"],
		queryFn: DashboardApi.getInstructorDashboardStats,
	});

	const { data: revenueStats = null, isLoading: revenueLoading, refetch: refetchRevenueStats } = useQuery({
		queryKey: ["instructor", "revenue"],
		queryFn: WalletApi.getRevenueStats,
	});

	const isLoading = coursesLoading || statsLoading || revenueLoading;

	const avgRating = useMemo(() => {
		if (courses.length === 0) return "0.0";
		return (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1);
	}, [courses]);

	const handleCoursesChanged = () => {
		queryClient.invalidateQueries({ queryKey: ["instructor", "stats"] });
		queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] });
	};

	const handleMaterialsChanged = () => {
		queryClient.invalidateQueries({ queryKey: ["instructor", "stats"] });
	};

	const handleAddCourse = () => {
		handleCoursesChanged();
	}

	const handleUpdateCourse = async () => {
		handleCoursesChanged();
	};

	if (isLoading || !stats || !revenueStats) return (<FullPageLoader />);

	const summaryCards = [
		{ label: "Active Courses", value: stats.totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
		{ label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-green-600", bg: "bg-green-50" },
		{ label: "Avg Rating", value: stats.averageRating, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
		{ label: "Resources", value: stats.totalMaterials, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
	];

	return (
		<div className="min-h-screen bg-slate-50">
			<HeaderInstructor />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-slate-900 mb-1">Instructor Dashboard</h1>
						<p className="text-slate-500">Performance insights and course management</p>
					</div>
					<CreateNewCourse
						createCourseOpen={createCourseOpen}
						setCreateCourseOpen={setCreateCourseOpen}
						handleCoursesChanged={handleCoursesChanged}
						onSave={handleAddCourse}
					/>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
					{summaryCards.map((card, i) => (
						<Card key={i} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-center gap-4">
								<div className={`${card.bg} ${card.color} p-3 rounded-xl`}>
									<card.icon className="w-6 h-6" />
								</div>
								<div>
									<p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
									<p className="text-2xl font-bold text-slate-900">{card.value}</p>
								</div>
							</div>
						</Card>
					))}
				</div>

				{/* Main Content Tabs */}
				<Tabs defaultValue="courses" className="space-y-6">
					<TabsList>
						<TabsTrigger value="courses">My Courses</TabsTrigger>
						<TabsTrigger value="materials">Learning Materials</TabsTrigger>
						<TabsTrigger value="students">Students</TabsTrigger>
						<TabsTrigger value="revenue">Revenue</TabsTrigger>
						<TabsTrigger value="analytics">Analytics</TabsTrigger>
					</TabsList>

					<TabsContent value="courses" className="space-y-4">
						{courses.map((course) => (
							<Card key={course.id} className="p-6">
								<div className="flex gap-6">
									<img
										src={course.thumbnail || '/assets/images/sample-thumnail-course.jpg'}
										alt={course.title}
										className="w-48 h-32 object-cover rounded-lg"
									/>
									<div className="flex-1">
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="text-xl font-semibold mb-2">{course.title}</h3>
												<p className="text-gray-600 mb-2 line-clamp-2">{course.description}</p>
												<div className="flex items-center gap-3">
													<Badge>{course.categoryName}</Badge>
													<Badge variant="outline">{getCourseLevelName(course.level)}</Badge>
												</div>
											</div>
										</div>
										<div className="grid grid-cols-4 gap-4 pt-4 border-t">
											<div>
												<p className="text-sm text-gray-600">Students</p>
												<p className="text-lg font-semibold">{course.students}</p>
											</div>
											<div>
												<p className="text-sm text-gray-600">Rating</p>
												<p
													className={`text-lg font-semibold ${course.rating === 0 ? "text-gray-400" : ""
														}`}
												>
													⭐ {course.rating === 0 ? "No ratings yet" : course.rating}
												</p>
											</div>
											<div>
												<p className="text-sm text-gray-600">Price</p>
												<p className="text-lg font-semibold text-green-600">
													{formatCurrency(course.price)}
												</p>
											</div>
										</div>
										<div className="flex gap-2 mt-4">
											<Button variant="outline" className="gap-2" onClick={() => { setEditCourseOpen(true); setSelectedCourse(course); }}>
												<Settings className="w-4 h-4" />
												Edit Course
											</Button>
											<Button
												variant="outline"
												className="gap-2"
												onClick={() => handleOpenAnalytics(course.id, course.title)}
											>
												<BarChart3 className="w-4 h-4" />
												View Analytics
											</Button>
										</div>
									</div>
								</div>
							</Card>
						))}
					</TabsContent>

					<TabsContent value="materials" className="space-y-4">
						<div className="flex justify-between items-center mb-4">
							<p className="text-sm text-gray-600">
								Upload materials for AI-powered student assistance
							</p>
						</div>

						<Card>
							<div className="p-4 border-b">
								<h3 className="font-semibold">Knowledge Base Documents</h3>
								<p className="text-sm text-gray-600">Materials used by AI assistant</p>
							</div>
							<LearningMaterial />
						</Card>
					</TabsContent>

					<TabsContent value="students" className="space-y-4">
						<Card className="p-6">
							<h3 className="font-semibold mb-4">Recent Student Activity</h3>
							<StudentTabContent />
						</Card>
					</TabsContent>

					{/* ===== REVENUE TAB ===== */}
					<TabsContent value="revenue" className="space-y-6">
						{revenueStats ? (
							<>
								{/* Revenue Summary Cards */}
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
									<Card className="p-6 border-none shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
										<div className="flex items-center gap-4">
											<div className="bg-green-100 text-green-600 p-3 rounded-xl">
												<Wallet className="w-6 h-6" />
											</div>
											<div>
												<p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Số dư hiện tại</p>
												<p className="text-2xl font-bold text-green-700">{formatCurrency(revenueStats.balance)}</p>
											</div>
										</div>
									</Card>
									<Card className="p-6 border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
										<div className="flex items-center gap-4">
											<div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
												<DollarSign className="w-6 h-6" />
											</div>
											<div>
												<p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng thu nhập</p>
												<p className="text-2xl font-bold text-blue-700">{formatCurrency(revenueStats.totalEarned)}</p>
											</div>
										</div>
									</Card>
									<Card className="p-6 border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
										<div className="flex items-center gap-4">
											<div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
												<Clock className="w-6 h-6" />
											</div>
											<div>
												<p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Đang chờ rút</p>
												<p className="text-2xl font-bold text-amber-700">{formatCurrency(revenueStats.pendingWithdrawal)}</p>
											</div>
										</div>
									</Card>
								</div>

								{/* Withdrawal Action */}
								<div className="flex justify-end">
									<WithdrawalDialog
										balance={revenueStats.balance}
										minAmount={0}
										onSuccess={refetchRevenueStats}
									/>
								</div>

								{/* Revenue Chart */}
								<Card className="p-6 border-none shadow-sm">
									<h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
										<TrendingUp className="w-5 h-5 text-green-500" />
										Doanh thu theo tháng
									</h3>
									<div className="h-[300px]">
										{revenueStats.monthlyRevenue.length > 0 ? (
											<ResponsiveContainer width="100%" height="100%">
												<AreaChart data={revenueStats.monthlyRevenue}>
													<defs>
														<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
															<stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
															<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
														</linearGradient>
													</defs>
													<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
													<XAxis
														dataKey="month"
														axisLine={false}
														tickLine={false}
														tick={{ fill: '#94a3b8', fontSize: 12 }}
													/>
													<YAxis
														axisLine={false}
														tickLine={false}
														tick={{ fill: '#94a3b8', fontSize: 12 }}
														tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
													/>
													<Tooltip
														contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
														formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
													/>
													<Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" />
												</AreaChart>
											</ResponsiveContainer>
										) : (
											<div className="h-full flex items-center justify-center text-slate-400">
												<p>Chưa có dữ liệu doanh thu</p>
											</div>
										)}
									</div>
								</Card>

								{/* Recent Orders */}
								<Card className="p-6 border-none shadow-sm">
									<h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
										<DollarSign className="w-5 h-5 text-blue-500" />
										Giao dịch gần đây
									</h3>
									{revenueStats.recentOrders.length > 0 ? (
										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="border-b border-slate-100">
														<th className="text-left py-3 px-4 text-slate-500 font-medium">Học sinh</th>
														<th className="text-left py-3 px-4 text-slate-500 font-medium">Khóa học</th>
														<th className="text-right py-3 px-4 text-slate-500 font-medium">Tổng tiền</th>
														<th className="text-right py-3 px-4 text-slate-500 font-medium">Nhận được (70%)</th>
														<th className="text-right py-3 px-4 text-slate-500 font-medium">Ngày</th>
													</tr>
												</thead>
												<tbody>
													{revenueStats.recentOrders.map((order) => (
														<tr key={order.orderId} className="border-b border-slate-50 hover:bg-slate-50/50">
															<td className="py-3 px-4 font-medium text-slate-800">{order.studentName}</td>
															<td className="py-3 px-4 text-slate-600">{order.courseTitle}</td>
															<td className="py-3 px-4 text-right text-slate-600">{formatCurrency(order.totalAmount)}</td>
															<td className="py-3 px-4 text-right font-semibold text-green-600">{formatCurrency(order.teacherShare)}</td>
															<td className="py-3 px-4 text-right text-slate-400">{format(new Date(order.paidAt), "dd/MM/yyyy")}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<div className="py-12 text-center text-slate-400">
											<DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
											<p>Chưa có giao dịch nào</p>
										</div>
									)}
								</Card>
							</>
						) : (
							<Card className="p-12 text-center border-none shadow-sm">
								<Wallet className="w-16 h-16 mx-auto mb-4 text-slate-300" />
								<h3 className="text-lg font-semibold text-slate-600 mb-2">Đang tải dữ liệu doanh thu...</h3>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="analytics" className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Growth Chart */}
							<Card className="p-6 border-none shadow-sm">
								<h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-blue-500" />
									Enrollment Growth
								</h3>
								<div className="h-[300px]">
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={stats.enrollmentTrends}>
											<defs>
												<linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
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
											/>
											<YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
											<Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
											<Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fill="url(#colorEnroll)" />
										</AreaChart>
									</ResponsiveContainer>
								</div>
							</Card>

							{/* AI Section with Real Data */}
							<Card className="p-6 border-none shadow-sm space-y-4">
								<h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
									<Brain className="w-5 h-5 text-purple-500" />
									AI Assistant Performance
								</h3>
								<p className="text-slate-500 text-sm mb-6">Metrics for AI interactions within your courses</p>

								<div className="grid grid-cols-2 gap-4">
									<div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
										<div className="flex items-center gap-3 text-blue-600 mb-2">
											<MessageSquare className="w-5 h-5" />
											<span className="text-sm font-semibold uppercase tracking-tight">Total Queries</span>
										</div>
										<p className="text-3xl font-bold text-slate-900">{stats.aiUsage.totalQuestions}</p>
									</div>

									<div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50">
										<div className="flex items-center gap-3 text-purple-600 mb-2">
											<Clock className="w-5 h-5" />
											<span className="text-sm font-semibold uppercase tracking-tight">Avg Response</span>
										</div>
										<p className="text-3xl font-bold text-slate-900">{stats.aiUsage.avgResponseTimeSeconds}s</p>
									</div>
								</div>

								<div className="mt-8 p-4 bg-slate-50 rounded-xl">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-slate-600">Response Efficiency</span>
										<span className="text-sm font-bold text-green-600">98.2%</span>
									</div>
									<div className="w-full bg-slate-200 rounded-full h-1.5">
										<div className="bg-green-500 h-1.5 rounded-full" style={{ width: '98.2%' }} />
									</div>
								</div>
							</Card>
						</div>

						{/* Recent Reviews Section */}
						<Card className="p-6 border-none shadow-sm">
							<h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
								<Star className="w-5 h-5 text-yellow-500" />
								Recent Student Reviews
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{stats.recentReviews.length > 0 ? (
									stats.recentReviews.map((review, i) => (
										<div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors shadow-sm">
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
														{review.studentName.charAt(0)}
													</div>
													<span className="text-sm font-semibold text-slate-800 line-clamp-1">{review.studentName}</span>
												</div>
												<div className="flex items-center gap-0.5 text-yellow-500">
													<Star className="w-3 h-3 fill-current" />
													<span className="text-xs font-bold">{review.rating}</span>
												</div>
											</div>
											<p className="text-xs text-slate-400 mb-1">Course:</p>
											<p className="text-sm text-slate-600 line-clamp-1 mb-3">{review.courseTitle}</p>
											<p className="text-[10px] text-slate-400 font-medium">
												{format(new Date(review.date), "MMM dd, yyyy")}
											</p>
										</div>
									))
								) : (
									<div className="col-span-full py-12 text-center text-slate-400">
										<Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
										<p>No recent reviews found</p>
									</div>
								)}
							</div>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			{selectedCourse && (
				<EditCourse
					editCourseOpen={editCourseOpen}
					setEditCourseOpen={setEditCourseOpen}
					selectedCourse={selectedCourse}
					handleMaterialsChanged={handleMaterialsChanged}
					onSave={handleUpdateCourse}
				/>
			)}

			{/* Edit Document Dialog */}


			{analyticsCourse && (
				<CourseAnalyticsDialog
					open={analyticsOpen}
					onOpenChange={setAnalyticsOpen}
					courseId={analyticsCourse.id}
					courseTitle={analyticsCourse.title}
				/>
			)}

			{/* Analytics Dialog */}
			<AiAssistant></AiAssistant>
		</div>
	);
}