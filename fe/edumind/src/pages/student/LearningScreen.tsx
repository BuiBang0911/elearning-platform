import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, Circle, Menu, PlayCircle } from "lucide-react";
import CourseApi from "../../api/Course.api";
import type { CourseDetailForStudentDto } from "../../interfaces/Course";
import type { LessonByStudent } from "../../interfaces/Lesson";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import lessonApi from "../../api/Lesson.api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LearningScreen = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState<CourseDetailForStudentDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const fetchDetails = async () => {
        try {
            if (id) {
                const res = await CourseApi.getCourseDetailForStudent(id);
                setCourse(res);
                
                // Set first lesson if not set
                if (res.lessons && res.lessons.length > 0 && !activeLessonId) {
                    // Try to find first uncompleted lesson
                    const firstUncompleted = res.lessons.find((l: LessonByStudent) => !l.isCompleted);
                    if (firstUncompleted) {
                        setActiveLessonId(firstUncompleted.id);
                    } else {
                        setActiveLessonId(res.lessons[0].id);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch course details", error);
            toast.error("Failed to load course.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchDetails();
    }, [id]);

    const activeLesson = course?.lessons.find(l => l.id === activeLessonId);

    const handleLessonToggleComplete = async (lesson: LessonByStudent) => {
        try {
            if (lesson.isCompleted) {
                await lessonApi.uncompleteLesson(lesson.id);
                toast.success("Lesson marked as incomplete.");
            } else {
                await lessonApi.completeLesson(lesson.id);
                toast.success("Lesson completed! 🎉");
            }
            await fetchDetails();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update lesson status.");
        }
    };

    const handleNextLesson = async () => {
        if (!course || !activeLesson) return;
        
        // Mark current as complete if not
        if (!activeLesson.isCompleted) {
            await handleLessonToggleComplete(activeLesson);
        }

        // Find next lesson
        const currentIndex = course.lessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex !== -1 && currentIndex < course.lessons.length - 1) {
            setActiveLessonId(course.lessons[currentIndex + 1].id);
        } else {
            toast.success("You have finished all lessons!");
        }
    };

    if (isLoading) return <FullPageLoader />;
    if (!course) return <div className="text-center py-20 text-xl font-semibold">Course not found.</div>;

    return (
        <div className="flex h-screen bg-white overflow-hidden text-slate-800">
            {/* Sidebar Syllabus */}
            <div 
                className={`${isSidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 transition-all duration-300 ease-in-out bg-slate-50 border-r border-slate-200 overflow-y-auto flex flex-col h-full`}
            >
                <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg leading-tight mb-2 truncate" title={course.title}>
                        {course.title}
                    </h2>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 font-medium">Progress</span>
                        <span className="font-bold text-blue-600">{course.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                </div>
                
                <div className="flex-1 overflow-y-auto py-2">
                    {course.lessons.map((lesson, idx) => {
                        const isActive = lesson.id === activeLessonId;
                        return (
                            <div 
                                key={lesson.id}
                                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-100 transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                onClick={() => setActiveLessonId(lesson.id)}
                            >
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLessonToggleComplete(lesson);
                                    }}
                                    className="mt-0.5 focus:outline-none"
                                >
                                    {lesson.isCompleted ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-100" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-slate-300" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <div className={`font-medium leading-tight ${isActive ? 'text-blue-800' : 'text-slate-700'}`}>
                                        {idx + 1}. {lesson.title}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                        <PlayCircle className="w-3 h-3" /> Video / PDF
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white">
                {/* Header Navbar */}
                <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-white flex-shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="font-semibold text-lg truncate">
                            {activeLesson ? activeLesson.title : 'Loading...'}
                        </h1>
                    </div>
                    <div>
                        <Button variant="ghost" className="gap-2" onClick={() => navigate(`/student/course/${course.id}`)}>
                            <ChevronLeft className="w-4 h-4" /> Back to Course
                        </Button>
                    </div>
                </header>

                {/* Lesson Viewer Area */}
                <main className="flex-1 overflow-y-auto w-full bg-white flex justify-center">
                    <div className="w-full max-w-4xl p-6 md:p-10 pb-32">
                        {activeLesson ? (
                            <div className="prose prose-slate max-w-none w-full">
                                {activeLesson.content ? (
                                    <Markdown remarkPlugins={[remarkGfm]}>
                                        {activeLesson.content}
                                    </Markdown>
                                ) : (
                                    <div className="py-20 text-center text-slate-500">
                                        <PlayCircle className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-xl font-medium mb-2">Video Lesson</h3>
                                        <p>The content for this lesson is primarily video-based.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 mt-20">Select a lesson to start learning</div>
                        )}
                        
                        {/* Action Bar at bottom of content */}
                        {activeLesson && (
                            <div className="mt-16 pt-8 border-t border-slate-200 flex justify-end">
                                <Button 
                                    onClick={handleNextLesson} 
                                    className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
                                >
                                    {activeLesson.isCompleted ? 'Next Lesson' : 'Complete and Continue'}
                                </Button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LearningScreen;
