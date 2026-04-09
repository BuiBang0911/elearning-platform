import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { CourseCardSkeleton } from "../ui/skeleton";
import { useEffect, useState } from "react";
import { type CourseResponse } from "../../interfaces/Course";
import CourseApi from "../../api/Course.api";
import { Link } from "react-router-dom";
import type { PagedList } from "../../interfaces";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";

const RecommendCourse = () => {
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedRecommended, setPaginatedRecommended] = useState<PagedList<CourseResponse>>({
        items: [],
        pageIndex: currentPage,
        pageSize: itemsPerPage,
        totalCount: 0,
    });

    useEffect(() => {
        const fetchRecommended = async () => {
            setIsLoadingRecommended(true);
            const res = await CourseApi.getTopRatedCourses({ pageIndex: 0, pageSize: 10 });
            setPaginatedRecommended(res);
            setIsLoadingRecommended(false);
        }
        fetchRecommended();
    }, [])

    return (<TabsContent value="recommended" className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
            {isLoadingRecommended ? (
                Array.from({ length: 10 }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
                ))
            ) : (
                paginatedRecommended.items.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-60 object-contain bg-gray-100"
                        />
                        <div className="p-4">
                            <Badge className="mb-2">{course.categoryName}</Badge>
                            <h3 className="font-semibold mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {course.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span>{course.lectureName}</span>
                                <span>⭐ {course.rating}</span>
                            </div>
                            <Link to={`/course/${course.id}`}>
                                <Button variant="outline" className="w-full">
                                    View Course
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))
            )}
        </div>
        {paginatedRecommended.totalCount > paginatedRecommended.pageSize && (
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
                        {Array.from({ length: Math.ceil(paginatedRecommended.totalCount / itemsPerPage) }, (_, i) => i + 1).map((page) => (
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
                                onClick={() => setCurrentPage(Math.min(Math.ceil(paginatedRecommended.totalCount / itemsPerPage), currentPage + 1))}
                                className={currentPage === Math.ceil(paginatedRecommended.totalCount / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        )}
    </TabsContent>)
}

export default RecommendCourse