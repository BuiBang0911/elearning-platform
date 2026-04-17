import type { PagedList, PagingRequest } from "../interfaces";
import type { CourseByStudentDashboard, CourseDetailForStudentDto, CourseForStudent, CourseListDto, CourseResponse, CourseResponseInstructorDashboard, CourseUpdateRequest } from "../interfaces/Course"
import type { DocumentResponse } from "../interfaces/Document";
import api from "./index.api"

const getAll = async (): Promise<CourseResponse[]> => {
  const res = await api.get("/Course");
  return res.data;
};

const getAllInstructorDashboard = async (): Promise<CourseResponseInstructorDashboard[]> => {
  const res = await api.get("/Course/get-course-dashboard");
  return res.data;
}

const getById = async (id: string | number): Promise<CourseResponse> => {
  const res = await api.get(`/Course/${id}`);
  return res.data;
};

const create = async (data: CourseUpdateRequest): Promise<CourseResponse> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (key === 'thumbnail' && value instanceof File) {
        formData.append(key, value);
      }
      else {
        formData.append(key, value.toString());
      }
    }
  });

  const res = await api.post("/Course", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

const update = async (id: string | number, data: CourseUpdateRequest): Promise<CourseResponse> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (key === 'thumbnail' && value instanceof File) {
        formData.append(key, value);
      }
      else {
        formData.append(key, value.toString());
      }
    }
  });

  const res = await api.put(`/Course/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

const remove = async (id: string | number): Promise<void> => {
  await api.delete(`/Course/${id}`);
};

const getPage = async (page: number, pageSize: number): Promise<PagedList<CourseResponse>> => {
  const res = await api.get("/Course/get-page", { params: { page, pageSize } });
  return res.data;
};

const getCount = async (): Promise<number> => {
  const res = await api.get("/Course/count");
  return res.data;
};

const getCourseByStudentDashboard = async (studentId: number): Promise<CourseByStudentDashboard[]> => {
  const res = await api.post(`/Course/course-by-student-dashboard/${studentId}`);
  return res.data;
};

const searchDocuments = async (courseId: number, searchTerm?: string): Promise<DocumentResponse[]> => {
  const res = await api.get(`/Course/${courseId}/documents/search`, { params: { searchTerm } });
  return res.data;
};

const GetCoursesForStudent = async (): Promise<CourseForStudent[]> => {
  const res = await api.get(`/Course/get-courses-for-student`);
  return res.data;
};

const getTopRatedCourses = async (pagingRequest: PagingRequest): Promise<PagedList<CourseResponse>> => {
  const res = await api.post(`/Course/get-top-rated-courses`, pagingRequest);
  return res.data;
};

const getAllCoursesForStudent = async (pagingRequest: PagingRequest, search: string): Promise<PagedList<CourseListDto>> => {
  const res = await api.post(`/Course/get-all-course-for-student?search=${encodeURIComponent(search)}`, pagingRequest);
  return res.data;
}

const getCourseDetailForStudent = async (id: number | string): Promise<CourseDetailForStudentDto> => {
  const res = await api.get(`/Course/student/detail/${id}`);
  return res.data;
}



const CourseApi = {
  getAll,
  getById,
  create,
  update,
  remove,
  getPage,
  getCount,
  getAllInstructorDashboard,
  getCourseByStudentDashboard,
  searchDocuments,
  GetCoursesForStudent,
  getTopRatedCourses,
  getAllCoursesForStudent,
  getCourseDetailForStudent,
};

export default CourseApi;