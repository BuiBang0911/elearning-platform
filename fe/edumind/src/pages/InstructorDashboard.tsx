import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getCourseLevelName, type CourseResponse, type CourseResponseInstructorDashboard } from "../interfaces/Course";
import HeaderInstructor from "../components/Header/HeaderInstructor";
import CreateNewCourse from "../components/Instructor/CreateNewCourse";
import CourseApi from "../api/Course.api";
import EditCourse from "../components/Instructor/EditCourse";
import LearningMaterial from "../components/Instructor/LearningMaterial/LearningMaterial";
import StudentTabContent from "../components/Instructor/StudentTabContent";
import documentApi from "../api/Document.api";
import enrrollementApi from "../api/Enrollment";
import AiAssistant from "../components/AiAssistant/AiAssistant";
import FullPageLoader from "../components/PostLoading/FullPageLoader";

export default function InstructorDashboard() {
	const [courses, setCourses] = useState<CourseResponseInstructorDashboard[]>([]);
	const [editCourseOpen, setEditCourseOpen] = useState(false);
	const [selectedCourse, setSelectedCourse] = useState<CourseResponseInstructorDashboard | null>(null);
	const [analyticsOpen, setAnalyticsOpen] = useState(false);
	const [createCourseOpen, setCreateCourseOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState({
		totalsCourses: 0,
		totalStudents: 0,
		avgRating: 0,
		totalKnowledgeDocuments: 0
	});

	console.log(analyticsOpen);


	useEffect(() => {
		const fetchCourses = async () => {
			try {
				setIsLoading(true);
				const [coursesData, knowledgeDocuments, totalStudents] = await Promise.all([
					CourseApi.getAllInstructorDashboard(),
					documentApi.getByInstructorId({ pageIndex: 1, pageSize: 1 }),
					enrrollementApi.getTotalStudents()
				]);
				setStats(prev => ({
					...prev,
					totalsCourses: coursesData.length,
					totalStudents: totalStudents,
					avgRating: (coursesData.reduce((sum, c) => sum + c.rating, 0) / coursesData.length),
					totalKnowledgeDocuments: knowledgeDocuments.totalCount,
				}));
				setCourses(coursesData);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching courses:", error);
				setIsLoading(false);
			}
		};

		fetchCourses();
	}, []);

	const avgRating = (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1);

	const handleCoursesChanged = (delta: number) => {
		setStats(prev => ({
			...prev,
			totalsCourses: prev.totalsCourses + delta
		}));
	};

	const handleMaterialsChanged = (delta: number) => {
		setStats(prev => ({
			...prev,
			totalKnowledgeDocuments: prev.totalKnowledgeDocuments + delta
		}));
	};

	const handleAddCourse = (newDoc: CourseResponse) => {
		const newCourse: CourseResponseInstructorDashboard = {
			...newDoc,
			students: 0 // hoặc 0 tùy kiểu của bạn
		};
		setCourses(prev => [...prev, newCourse]);
	}

	if (isLoading) return (<FullPageLoader />);

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header */}
			<HeaderInstructor />

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome Section */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
						<p className="text-gray-600">Manage your courses and students</p>
					</div>
					<CreateNewCourse createCourseOpen={createCourseOpen} setCreateCourseOpen={setCreateCourseOpen} handleCoursesChanged={handleCoursesChanged} onSave={handleAddCourse} />
				</div>

				{/* Stats */}
				<div className="grid sm:grid-cols-4 gap-4 mb-8">
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<BookOpen className="w-6 h-6 text-blue-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{courses.length}</p>
								<p className="text-sm text-gray-600">Active Courses</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<Users className="w-6 h-6 text-green-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</p>
								<p className="text-sm text-gray-600">Total Students</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
								<TrendingUp className="w-6 h-6 text-yellow-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{avgRating}</p>
								<p className="text-sm text-gray-600">Avg Rating</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
								<FileText className="w-6 h-6 text-purple-600" />
							</div>
							<div>
								<p className="text-2xl font-bold">{stats.totalKnowledgeDocuments}</p>
								<p className="text-sm text-gray-600">Materials</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Main Content Tabs */}
				<Tabs defaultValue="courses" className="space-y-6">
					<TabsList>
						<TabsTrigger value="courses">My Courses</TabsTrigger>
						<TabsTrigger value="materials">Learning Materials</TabsTrigger>
						<TabsTrigger value="students">Students</TabsTrigger>
						<TabsTrigger value="analytics">Analytics</TabsTrigger>
					</TabsList>

					<TabsContent value="courses" className="space-y-4">
						{courses.map((course) => (
							<Card key={course.id} className="p-6">
								<div className="flex gap-6">
									<img
										src={course.thumbnail || undefined}
										alt={course.title}
										className="w-48 h-32 object-cover rounded-lg"
									/>
									<div className="flex-1">
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="text-xl font-semibold mb-2">{course.title}</h3>
												<p className="text-gray-600 mb-2">{course.description}</p>
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
											{/* <div>
												<p className="text-sm text-gray-600">Modules</p>
												<p className="text-lg font-semibold">{course.modules.length}</p>
											</div> */}
											{/* <div>
												<p className="text-sm text-gray-600">Duration</p>
												<p className="text-lg font-semibold">{course.duration}</p>
											</div> */}
										</div>
										<div className="flex gap-2 mt-4">
											<Button variant="outline" className="gap-2" onClick={() => { setEditCourseOpen(true); setSelectedCourse(course); }}>
												<Settings className="w-4 h-4" />
												Edit Course
											</Button>
											{/* <EditCourse key={course.id} editCourseOpen={editCourseOpen} setEditCourseOpen={setEditCourseOpen} selectedCourse={course} handleMaterialsChanged={handleMaterialsChanged} /> */}
											<Button
												variant="outline"
												className="gap-2"
												onClick={() => setAnalyticsOpen(true)}
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
							{/* Upload Material */}
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

					<TabsContent value="analytics" className="space-y-4">
						<div className="grid sm:grid-cols-2 gap-4">
							<Card className="p-6">
								<h3 className="font-semibold mb-4">Course Performance</h3>
								<div className="space-y-4">
									{courses.map((course) => (
										<div key={course.id}>
											<div className="flex items-center justify-between mb-2">
												<span className="text-sm font-medium">{course.title}</span>
												<span className="text-sm text-gray-600">⭐ {course.rating}</span>
											</div>
											<div className="flex items-center gap-2">
												<div className="flex-1 bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-600 h-2 rounded-full"
														style={{ width: `${(course.rating / 5) * 100}%` }}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</Card>

							<Card className="p-6">
								<h3 className="font-semibold mb-4">AI Assistant Usage</h3>
								<div className="space-y-4">
									<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
										<div>
											<p className="text-sm text-gray-600">Total Questions</p>
											<p className="text-2xl font-bold">1,247</p>
										</div>
										<Brain className="w-8 h-8 text-blue-600" />
									</div>
									<div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
										<div>
											<p className="text-sm text-gray-600">Avg Response Time</p>
											<p className="text-2xl font-bold">1.2s</p>
										</div>
										<TrendingUp className="w-8 h-8 text-green-600" />
									</div>
								</div>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{selectedCourse && (
				<EditCourse
					editCourseOpen={editCourseOpen}
					setEditCourseOpen={setEditCourseOpen}
					selectedCourse={selectedCourse}
					handleMaterialsChanged={handleMaterialsChanged}
				/>
			)}

			{/* Edit Document Dialog */}


			{/* Analytics Dialog */}
			<AiAssistant></AiAssistant>
		</div>
	);
}