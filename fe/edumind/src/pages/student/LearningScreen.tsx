import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle, Circle, Menu, PlayCircle, FileText, ExternalLink } from "lucide-react";
import CourseApi from "../../api/Course.api";
import type { LessonByStudent } from "../../interfaces/Lesson";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import lessonApi from "../../api/Lesson.api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";

const LearningScreen = () => {
    const queryClient = useQueryClient();
    const { id = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { data: course, isLoading } = useQuery({
        queryKey: ["course", id],
        queryFn: async () => {
            const res = await CourseApi.getCourseDetailForStudent(id);
            // Set initial active lesson if not already set
            if (res.lessons && res.lessons.length > 0 && !activeLessonId) {
                const firstUncompleted = res.lessons.find((l: LessonByStudent) => !l.isCompleted);
                setActiveLessonId(firstUncompleted ? firstUncompleted.id : res.lessons[0].id);
            }
            return res;
        },
        enabled: !!id,
    });

    const activeLesson = useMemo(() =>
        course?.lessons.find(l => l.id === activeLessonId),
        [course, activeLessonId]);

    const videoUrl = useMemo(() => {
        if (!activeLesson) return null;
        
        // Priority 1: Direct videoUrl from lesson (new flow)
        if (activeLesson.videoUrl) return activeLesson.videoUrl;

        // Priority 2: Video in documents (legacy support)
        const videoFromDocs = activeLesson.documents?.find(doc =>
            doc.filePath.toLowerCase().match(/\.(mp4|mov|webm|ogg)$/)
        );
        return videoFromDocs?.filePath || null;
    }, [activeLesson]);

    const otherDocuments = useMemo(() => {
        if (!activeLesson?.documents) return [];
        // Filter out the video if it was found in the documents collection
        return activeLesson.documents.filter(doc => doc.filePath !== videoUrl);
    }, [activeLesson, videoUrl]);

    const handleLessonToggleComplete = async (lesson: LessonByStudent) => {
        try {
            if (lesson.isCompleted) {
                await lessonApi.uncompleteLesson(lesson.id);
            } else {
                await lessonApi.completeLesson(lesson.id);
                toast.success("Lesson completed! 🎉");
            }
            // Invalidate query to refresh course data (including progress)
            queryClient.invalidateQueries({ queryKey: ["course", id] });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status.");
        }
    };

    const handleNextLesson = async () => {
        if (!course || !activeLesson) return;
        if (!activeLesson.isCompleted) await handleLessonToggleComplete(activeLesson);
        const currentIndex = course.lessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < course.lessons.length - 1) {
            setActiveLessonId(course.lessons[currentIndex + 1].id);
        } else {
            toast.success("All lessons finished!");
        }
    };

    if (isLoading) return <FullPageLoader />;
    if (!course) return <div className="text-center py-20">Course not found.</div>;

    return (
        <div className="flex h-screen bg-white overflow-hidden text-slate-800">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 transition-all duration-300 bg-slate-50 border-r overflow-y-auto flex flex-col`}>
                <div className="p-4 border-b bg-white sticky top-0 z-10">
                    <h2 className="font-bold text-lg mb-2 truncate" title={course.title}>{course.title}</h2>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Overall Progress</span>
                        <span className="font-bold text-blue-600">{course.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5" />
                </div>

                <div className="flex-1 py-2">
                    {course.lessons.map((lesson, idx) => {
                        const isActive = lesson.id === activeLessonId;
                        return (
                            <div
                                key={lesson.id}
                                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-100 transition-all ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}
                                onClick={() => setActiveLessonId(lesson.id)}
                            >
                                <button onClick={(e) => { e.stopPropagation(); handleLessonToggleComplete(lesson); }}>
                                    {lesson.isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                </button>
                                <div className="flex-1">
                                    <div className={`text-sm font-semibold leading-tight ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                                        {idx + 1}. {lesson.title}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                        <PlayCircle className="w-3 h-3" />
                                        {lesson.documents?.some(d => d.fileName.toLowerCase().endsWith('.mp4')) ? 'Video Included' : 'Reading'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
                <header className="h-16 border-b flex items-center justify-between px-6 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="font-bold text-lg">{activeLesson?.title || 'Loading...'}</h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/student/course/${course.id}`)}>
                        <ChevronLeft className="w-4 h-4 mr-2" /> Course Home
                    </Button>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="max-w-4xl mx-auto px-2 py-8 md:px-12 pb-32">
                        {activeLesson ? (
                            <div className="space-y-8">
                                {/* Video Section */}
                                {videoUrl && (
                                    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200">
                                        <video
                                            key={videoUrl}
                                            controls
                                            className="w-full h-full object-contain"
                                            poster={course.thumbnail}
                                        >
                                            <source src={videoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}

                                {/* Content Section
                                <Card className="p-8 border-none shadow-sm ring-1 ring-slate-200">
                                    <h2 className="text-2xl font-bold mb-6 text-slate-900 leading-tight">{activeLesson.title}</h2>
                                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600">
                                        {activeLesson.content ? (
                                            <Markdown remarkPlugins={[remarkGfm]}>{activeLesson.content}</Markdown>
                                        ) : (
                                            <div className="py-12 text-center text-slate-400 font-medium">
                                                No text content provided for this lesson.
                                            </div>
                                        )}
                                    </div>
                                </Card> */}

                                {/* Materials Section */}
                                {otherDocuments.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-500" />
                                            Reading Materials ({otherDocuments.length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {otherDocuments.map(doc => (
                                                <a
                                                    key={doc.id}
                                                    href={doc.filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">{doc.fileName}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">PDF Document</p>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-12 pt-8 border-t flex justify-end">
                                    <Button onClick={handleNextLesson} size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-8">
                                        {activeLesson.isCompleted ? 'Next Lesson' : 'Complete and Continue'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-400">Select a lesson to begin.</div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LearningScreen;
