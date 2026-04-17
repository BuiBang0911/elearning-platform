import React, { useEffect, useState } from "react";
import {
  Search,
  Trash2,
  BookOpen,
  Star,
  Users,
  Calendar,
  ExternalLink
} from "lucide-react";
import AdminApi, { type AdminCourse } from "../../api/admin.api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

const AdminCourseManagement = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCourses = async () => {
    try {
      const data = await AdminApi.getCourses();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await AdminApi.deleteCourse(courseId);
      toast.success("Course deleted permanently");
      fetchCourses();
    } catch (err) {
      toast.error("Failed to delete course");
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <FullPageLoader isFullPage={false} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-slate-500">Review and moderate all platform courses.</p>
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title or instructor..."
            className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="font-semibold text-slate-800 line-clamp-1">{course.title}</p>
                      <Badge variant="outline" className="w-fit p-0 h-auto text-[10px] text-slate-400 uppercase tracking-tighter">
                        {course.categoryName}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">{course.instructorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Users className="w-3 h-3 text-slate-400" />
                        {course.studentCount} Students
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {course.rating.toFixed(1)} Rating
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(course.createdAt), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/student/course/${course.id}`} target="_blank">
                        <Button variant="ghost" size="icon" title="View Course">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete Course">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the
                              <span className="font-bold text-slate-900"> "{course.title}" </span>
                              course and all associated lessons and enrollments.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCourse(course.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-slate-800 font-bold">No courses found</h3>
              <p className="text-slate-500">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCourseManagement;
