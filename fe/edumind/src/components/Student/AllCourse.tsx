import { TrendingUp } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { CourseCardSkeleton } from "../ui/skeleton";
import { TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import type { CourseListDto } from "../../interfaces/Course";
import { useEffect, useState } from "react";
import CourseApi from "../../api/Course.api";
import type { PagedList } from "../../interfaces";
import { Link } from "react-router-dom";

const AllCourse = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [allCourses, setAllCourses] = useState<PagedList<CourseListDto>>({
        items: [],
        pageIndex: 0,
        pageSize: itemsPerPage,
        totalCount: 0,
    });

    useEffect(() => {
        const fetchAllCourses = async () => {
            setIsLoadingAll(true);
            try {
                const res = await CourseApi.getAllCoursesForStudent({ pageIndex: currentPage - 1, pageSize: itemsPerPage }, searchQuery);
                setAllCourses(res);
                console.log(searchQuery);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setIsLoadingAll(false);
            }
        };
        fetchAllCourses();
    }, [currentPage, itemsPerPage, searchQuery]);

    return (
        <TabsContent value="all" className="space-y-4">
            <div className="mb-4">
                <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="max-w-md"
                />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
                {isLoadingAll ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                        <CourseCardSkeleton key={i} />
                    ))
                ) : (
                    allCourses.items.map((course) => (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <img
                                src={course.thumbnail || '/assets/images/sample-thumnail-course.jpg'}
                                alt={course.title}
                                className="w-full h-60 object-contain bg-gray-100"
                            />
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge>{course.categoryName}</Badge>
                                    {course.progress && course.progress > 0 && (
                                        <Badge variant="outline" className="gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {course.progress}%
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="font-semibold mb-2 break-words">{course.title}</h3>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words whitespace-pre-wrap">
                                    {course.description}
                                </p>
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                    <span>{course.totalStudents.toLocaleString()} students</span>
                                    <span>⭐ {course.rating}</span>
                                </div>
                                <Link to={`/student/course/${course.id}`}>
                                    <Button variant="outline" className="w-full">
                                        {course.isEnrolled ? "Continue" : "Start Course"}
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))
                )}
            </div>
            {allCourses.totalCount > itemsPerPage && (
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Items per page:</span>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="12">12</SelectItem>
                                <SelectItem value="18">18</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.ceil(allCourses.totalCount / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={page === currentPage}
                                        className="cursor-pointer"
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(Math.ceil(allCourses.totalCount / itemsPerPage), currentPage + 1))}
                                    className={currentPage === Math.ceil(allCourses.totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </TabsContent>
    )
}

export default AllCourse;