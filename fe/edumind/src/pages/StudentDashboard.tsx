import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
    BookOpen,
    CheckCircle2,
    Award,
} from "lucide-react";
import HeaderStudent from "../components/Student/HeaderStudent";
import CourseApi from "../api/Course.api";
import CoursesEnrolled from "../components/Student/CoursesEnrolled";
import type { CourseForStudent } from "../interfaces/Course";
import RecommendCourse from "../components/Student/RecommendCourse";
import AllCourse from "../components/Student/AllCourse";
import FullPageLoader from "../components/PostLoading/FullPageLoader";
import { DashboardApi } from "../api/Dashboard.api";
import type { DashboardStats } from "../interfaces/dashboard";

import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
    const { user: currentUser } = useAuth();
    const [coursesEnrolled, setCoursesEnrolled] = useState<CourseForStudent[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [studentStats, setStudentStats] = useState<DashboardStats>({
        enrolledCount: 0,
        completedCount: 0,
        totalLessonsFinished: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoadingData(true);
                const [coursesRes, statsRes] = await Promise.all([
                    CourseApi.GetCoursesForStudent(),
                    DashboardApi.getStudentDashboardStats()
                ]);
                setStudentStats(statsRes);
                setCoursesEnrolled(coursesRes);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (isLoadingData) return (<FullPageLoader />);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <HeaderStudent />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className={"grid lg:grid-cols-1 gap-8"}>
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-1">
                        {/* Welcome Section */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Welcome back, {currentUser?.fullName?.split(" ")[0]}! 👋
                            </h1>
                            <p className="text-gray-600">Continue your learning journey</p>
                        </div>

                        {/* Stats */}
                        <div className="grid sm:grid-cols-3 gap-4 mb-8">
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{studentStats.enrolledCount}</p>
                                        <p className="text-sm text-gray-600">Enrolled Courses</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{studentStats.completedCount}</p>
                                        <p className="text-sm text-gray-600">Courses Completed</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Award className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{studentStats.totalLessonsFinished}</p>
                                        <p className="text-sm text-gray-600">Lessons Completed</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="continue" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="continue">Continue Learning</TabsTrigger>
                                <TabsTrigger value="recommended">Recommended</TabsTrigger>
                                <TabsTrigger value="all">All Courses</TabsTrigger>
                            </TabsList>

                            <CoursesEnrolled enrolledCourses={coursesEnrolled} />

                            <RecommendCourse />

                            <AllCourse />
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;