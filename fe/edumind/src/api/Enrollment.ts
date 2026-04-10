import type { PagedList, PagingRequest } from "../interfaces";
import type { UserResponse } from "../interfaces/auth";
import api from "./index.api";
import type { CourseResponse, UpdateRatingRequest } from "../interfaces/Course";

const enrrollementApi = {
    enroll: async (pagingRequest: PagingRequest): Promise<PagedList<UserResponse>> => {
        const res = await api.post(`/Enrollment/get-students`, pagingRequest);
        return res.data;
    },

    getCoursesByStudent: async (studentId: number): Promise<CourseResponse[]> => {
        const res = await api.get(`/Enrollment/get-courses-by-student/${studentId}`);
        return res.data;
    },

    getTotalStudents: async (): Promise<number> => {
        const res = await api.get(`/Enrollment/get-total-students`);
        return res.data;
    },

    getStudentByCourse: async (courseId: number): Promise<number> => {
        const res = await api.get(`/Enrollment/get-student-by-course/${courseId}`);
        return res.data;
    },

    updateRating: async (updateRatingRequest: UpdateRatingRequest): Promise<void> => {
        const res = await api.post(`/Enrollment/update-rating`, updateRatingRequest);
        return res.data;
    },

    enrollCourse: async (courseId: number): Promise<void> => {
        const res = await api.post(`/Enrollment/enroll/${courseId}`);
        return res.data;
    },
}

export default enrrollementApi;