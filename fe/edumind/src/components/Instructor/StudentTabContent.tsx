import { useEffect, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../ui/pagination";
import type { UserResponse } from "../../interfaces/auth";
import enrrollementApi from "../../api/Enrollment";
import type { PagedList } from "../../interfaces";
import { CheckCircle2, ChevronDown, ChevronRight, Circle } from "lucide-react";
import type { CourseByStudentDashboard } from "../../interfaces/Course";
import CourseApi from "../../api/Course.api";
import DashboardSkeleton from "../PostLoading/Loading";

const StudentTabContent = () => {
	const [studentsPage, setStudentsPage] = useState(1);
	// const [studentsPerPage, setStudentsPerPage] = useState(5);
	const [expandedStudent, setExpandedStudent] = useState(null as number | null);
	const [expandedCourse, setExpandedCourse] = useState(null as number | null);
	const [courseByStudent, setCourseByStudent] = useState<CourseByStudentDashboard[]>([]); // You can replace 'any' with a more specific type if you have one for the lessons
	const [isLoading, setIsLoading] = useState(false);

	const [studentsPaging, setStudentsPaging] = useState<PagedList<UserResponse>>({
		items: [],
		pageIndex: 1,
		pageSize: 5,
		totalCount: 0
	});

	const studentsPerPage = 5; // Fixed number of students per page
	const totalStudentPages = Math.ceil(studentsPaging.totalCount / studentsPerPage);

	useEffect(() => {
		// Fetch students data for the instructor's courses to populate the students tab
		const fetchStudents = async () => {
			try {
				setIsLoading(true);
				const res = await enrrollementApi.enroll({ pageIndex: studentsPage - 1, pageSize: studentsPerPage });
				setStudentsPaging(res);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching students:", error);
				setIsLoading(false);
			}
		};
		fetchStudents();
	}, [studentsPage]);

	const toggleStudent = async (id: number | null) => {
		try {
			const courses = await CourseApi.getCourseByStudentDashboard(id as number); // Fetch all courses for the student
			console.log(id);
			setCourseByStudent(courses);
			setExpandedCourse(null);
		} catch (error) {
			console.error("Error fetching courses for student:", error);
		}
		setExpandedStudent(expandedStudent === id ? null : id);
	};

	const toggleCourse = async (id: number | null) => {
		// try {
		// 	const lessons = await lessonApi.getByCourseId(id as number);
		// 	setLessonByCourse(lessons);
		// 	console.log("Lessons for course", id, lessonByCourse);
		// } catch (error) {
		// 	console.error("Error fetching lessons for course:", error);
		// }
		setExpandedCourse(expandedCourse === id ? null : id);
	};

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4">
			{studentsPaging.items.map((student) => (
				<div key={student.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
					{/* --- CẤP 1: THÔNG TIN HỌC SINH --- */}
					<div
						className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
						onClick={() => toggleStudent(student.id)}
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
								{student.fullName.charAt(0)}
							</div>
							<div>
								<p className="font-bold text-gray-800">{student.fullName}</p>
								<p className="text-xs text-gray-500">{student.email}</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							{/* <div className="text-right mr-4">
								<p className="text-sm font-medium text-blue-600">{student.courses.length} courses</p>
							</div> */}
							{expandedStudent === student.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
						</div>
					</div>

					{/* --- CẤP 2: DANH SÁCH KHÓA HỌC --- */}
					{expandedStudent === student.id && (
						<div className="bg-gray-50 border-t border-gray-100 p-4 space-y-2">
							<h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 ml-2">Courses Joined</h4>
							{courseByStudent.map((course) => (
								<div key={course.id} className="border border-gray-200 rounded-lg bg-white">
									<div
										className="p-3 flex justify-between items-center cursor-pointer hover:bg-blue-50/50"
										onClick={() => toggleCourse(course.id)}
									>
										<span className="font-medium text-sm text-gray-700">{course.title}</span>
										<div className="flex items-center gap-2">
											{/* <span className="text-xs text-gray-500">{course.progress}%</span> */}
											{expandedCourse === course.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
										</div>
									</div>
 
									{/* --- CẤP 3: DANH SÁCH LESSON --- */}
									{expandedCourse === course.id && (
										<div className="p-3 pt-0 space-y-1 ml-4 border-l-2 border-blue-100">
											{course.lessons.map((lesson) => (
												<div key={lesson.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md">
													<div className="flex items-center gap-2">
														{lesson.isCompleted ? (
															<CheckCircle2 size={16} className="text-green-500" />
														) : (
															<Circle size={16} className="text-gray-300" />
														)}
														<span className={`text-sm ${lesson.isCompleted ? 'text-gray-700' : 'text-gray-400 italic'}`}>
															{lesson.title}
														</span>
													</div>
													{lesson.isCompleted && (
														<span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
															completed
														</span>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			))}
			<Pagination className="mt-4">
				<PaginationContent>
					<PaginationPrevious
						onClick={() => setStudentsPage((prev) => Math.max(prev - 1, 1))}
						disabled={studentsPage === 1}
					>
						Previous
					</PaginationPrevious>
					{Array.from({ length: totalStudentPages }, (_, index) => (
						<PaginationItem key={index + 1}>
							<PaginationLink
								onClick={() => setStudentsPage(index + 1)}
								isActive={index + 1 === studentsPage}
							>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}
					<PaginationNext
						onClick={() => setStudentsPage((prev) => Math.min(prev + 1, totalStudentPages))}
						disabled={studentsPage === totalStudentPages}
					>
						Next
					</PaginationNext>
				</PaginationContent>
			</Pagination>
		</div>
	)
}

export default StudentTabContent;