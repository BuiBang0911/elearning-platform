import { TabsContent } from "../ui/tabs";
import type { CourseForStudent } from "../../interfaces/Course";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Link, Play, Star } from "lucide-react";
import { Button } from "../ui/button";
import enrrollementApi from "../../api/Enrollment";

type Props = {
    enrolledCourses: CourseForStudent[];
}

const CoursesEnrolled = ({ enrolledCourses }: Props) => {
    const handleRateCourse = async (courseId: number, rating: number) => {
        try {
            await enrrollementApi.updateRating({ courseId, rating });
        } catch (error) {
            console.error("Error updating course rating:", error);
        }
        console.log(`Rated course ${courseId} with ${rating} stars`);
    };

    return (
        <TabsContent value="continue" className="space-y-4">
            {enrolledCourses.map((course) => (
                <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-32 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{course.instructorName}</p>
                                </div>
                                <Badge>{course.level}</Badge>
                            </div>
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-medium">{course.progress}%</span>
                                </div>
                                <Progress value={course.progress} />
                            </div>
                            <div className="flex items-center gap-1 mb-3">
                                <span className="text-sm text-gray-600 mr-2">Your rating:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRateCourse(course.id, star)}
                                        className="focus:outline-none transition-colors"
                                    >
                                        <Star
                                            className={`w-5 h-5 ${star <= (course.rating || 0)
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                                }`}
                                        />
                                    </button>
                                ))}
                                {course.rating && (
                                    <span className="text-sm text-gray-600 ml-2">
                                        ({course.rating}/5)
                                    </span>
                                )}
                            </div>
                            <Link to={`/course/${course.id}`}>
                                <Button className="gap-2">
                                    <Play className="w-4 h-4" />
                                    Continue Learning
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            ))}
        </TabsContent>
    )
}

export default CoursesEnrolled;