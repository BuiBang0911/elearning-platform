import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { BookOpen, Clock, Star, Users, CheckCircle, ChevronLeft, CreditCard, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import CourseApi from "../../api/Course.api";
import type { CourseDetailForStudentDto } from "../../interfaces/Course";
import { getCourseLevelName } from "../../interfaces/Course";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import HeaderStudent from "../../components/Student/HeaderStudent";
import authApi from "../../api/auth.api";
import type { UserResponse } from "../../interfaces/auth";
import enrollmentApi from "../../api/Enrollment";
import PaymentApi from "../../api/Payment.api";
import { toast } from "sonner";
import { Progress } from "../../components/ui/progress";

import { useAuth } from "../../context/AuthContext";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CourseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [course, setCourse] = useState<CourseDetailForStudentDto | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setIsLoadingData(true);
                if (id) {
                    const res = await CourseApi.getCourseDetailForStudent(id);
                    setCourse(res);
                }
            } catch (error) {
                console.error("Failed to fetch course details", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleEnroll = async () => {
        if (!course) return;
        setIsEnrolling(true);
        try {
            await enrollmentApi.enrollCourse(course.id);
            toast.success("Successfully enrolled!");
            // Refresh course details
            const updated = await CourseApi.getCourseDetailForStudent(course.id);
            setCourse(updated);
        } catch (error) {
            console.error(error);
            toast.error("Failed to enroll.");
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleBuyCourse = async () => {
        if (!course) return;
        setIsPaying(true);
        try {
            const result = await PaymentApi.createPaymentLink(course.id);
            // Redirect to PayOS checkout
            window.location.href = result.checkoutUrl;
        } catch (error: any) {
            console.error(error);
            const message = error?.response?.data?.message || "Không thể tạo link thanh toán.";
            toast.error(message);
        } finally {
            setIsPaying(false);
        }
    };

    if (isLoadingData) return <FullPageLoader />;
    if (!course) return <div className="text-center py-20 text-xl font-semibold">Course not found.</div>;

    const levelName = getCourseLevelName(course.level) || "Beginner";
    const lessonCount = course.lessons?.length || 0;
    const isFree = !course.price || course.price === 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <HeaderStudent />

            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-4">
                        <Link to="/student" className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors mb-4">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600 hover:bg-blue-500">{course.categoryName}</Badge>
                            <Badge variant="outline" className="text-slate-300 border-slate-600">{levelName}</Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">{course.title}</h1>
                        <p className="text-lg text-slate-300 max-w-2xl">{course.description}</p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-4">
                            <div className="flex items-center gap-1">
                                <span className="text-yellow-400 font-bold text-lg">{course.rating.toFixed(1)}</span>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{course.totalStudents.toLocaleString()} students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                <span>{lessonCount} Lessons</span>
                            </div>
                            <div>
                                Instructor: <span className="font-semibold">{course.lectureName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8 relative">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Course Overview */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
                        <div className="grid sm:grid-cols-2 gap-3 text-slate-700">
                            <div className="flex gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Master the core concepts of this subject matter</span>
                            </div>
                            <div className="flex gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Real world practical applications and examples</span>
                            </div>
                            <div className="flex gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Step-by-step guidance from an industry expert</span>
                            </div>
                            <div className="flex gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                <span>Preparation for advanced related topics</span>
                            </div>
                        </div>
                    </div>

                    {/* Syllabus section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold mb-4">Course Syllabus</h2>
                        {course.lessons && course.lessons.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {course.lessons.map((lesson, idx) => (
                                    <AccordionItem key={lesson.id} value={`item-${lesson.id}`}>
                                        <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                                            <div className="flex flex-col items-start text-left gap-1">
                                                <span className="font-semibold text-slate-800">
                                                    Lesson {idx + 1}: {lesson.title}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-2 text-slate-600">
                                            {lesson.description || "No description provided for this lesson."}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-slate-500 py-4">No lessons have been published yet for this course.</div>
                        )}
                    </div>
                </div>

                {/* Sticky Enrollment Card Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-24 shadow-xl border-slate-200 overflow-hidden">
                        <img
                            src={course.thumbnail || '/assets/images/sample-thumnail-course.jpg'}
                            alt={course.title}
                            className="w-full h-48 object-cover border-b"
                        />
                        <div className="p-6 space-y-6">

                            {course.isEnrolled ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-600 font-medium">Your Progress</span>
                                        <span className="font-bold text-blue-600">{course.progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={course.progress} className="h-3" />
                                    <Button
                                        onClick={() => navigate(`/student/course/${course.id}/learn`)}
                                        className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                    >
                                        Continue Learning
                                    </Button>
                                    <p className="text-center text-sm text-slate-500 font-medium">
                                        You are enrolled in this course.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {isFree ? (
                                        <>
                                            <h3 className="text-2xl font-bold text-slate-800">Free</h3>
                                            <Button
                                                onClick={handleEnroll}
                                                disabled={isEnrolling}
                                                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isEnrolling ? "Enrolling..." : "Enroll Now"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-1">
                                                <h3 className="text-3xl font-bold text-slate-800">
                                                    {formatCurrency(course.price)}
                                                </h3>
                                            </div>
                                            <Button
                                                onClick={handleBuyCourse}
                                                disabled={isPaying}
                                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
                                            >
                                                {isPaying ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Đang tạo thanh toán...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-5 h-5" />
                                                        Mua khóa học
                                                    </>
                                                )}
                                            </Button>
                                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
                                                <img src="https://payos.vn/wp-content/uploads/sites/13/2024/08/payos-logo-nobg.png" alt="PayOS" className="h-5" />
                                                <span>Thanh toán qua PayOS</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="text-center text-sm text-slate-500 font-medium">
                                        30-Day Money-Back Guarantee
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <h4 className="font-semibold text-slate-800">This course includes:</h4>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-slate-400" />
                                        {lessonCount} Lessons
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        Self-paced learning
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
