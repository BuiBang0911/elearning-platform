import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { CourseCardSkeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import { type CourseListDto } from "../../interfaces/Course";
import CourseApi from "../../api/Course.api";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const RecommendCourse = () => {
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
    const [limit, setLimit] = useState(6);
    const [recommendedItems, setRecommendedItems] = useState<CourseListDto[]>([]);

    useEffect(() => {
        const fetchRecommended = async () => {
            setIsLoadingRecommended(true);
            try {
                const res = await CourseApi.getRecommendedCourses(limit);
                setRecommendedItems(res);
            } catch (error) {
                console.error("Failed to fetch recommendations", error);
            } finally {
                setIsLoadingRecommended(false);
            }
        }
        fetchRecommended();
    }, [limit])

    return (<TabsContent value="recommended" className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
            {isLoadingRecommended ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
                ))
            ) : (
                recommendedItems.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                            src={course.thumbnail || '/assets/images/sample-thumnail-course.jpg'}
                            alt={course.title}
                            className="w-full h-48 object-cover bg-gray-100"
                        />
                        <div className="p-4">
                            <Badge className="mb-2">{course.categoryName}</Badge>
                            <h3 className="font-semibold mb-2 line-clamp-1">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {course.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span className="truncate max-w-[120px]">{course.lectureName}</span>
                                <span className="flex items-center gap-1">⭐ {course.rating}</span>
                            </div>
                            <Link to={`/student/course/${course.id}`}>
                                <Button variant="outline" className="w-full">
                                    View Course
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))
            )}
        </div>
        
        {!isLoadingRecommended && recommendedItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
                <p className="text-gray-500">No recommendations found yet. Start exploring courses!</p>
            </div>
        )}

        <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select
                    value={limit.toString()}
                    onValueChange={(value) => setLimit(Number(value))}
                >
                    <SelectTrigger className="w-20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <p className="text-sm text-gray-500 italic">Personalized based on your learning journey 🚀</p>
        </div>
    </TabsContent>)
}

export default RecommendCourse