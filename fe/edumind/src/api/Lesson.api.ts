import type { LessonRequest, LessonResponse, LessonUpdateRequest } from "../interfaces/Lesson";
import api from "./index.api";

const lessonApi = {
  getAll: async (): Promise<LessonResponse[]> => {
    const res = await api.get("/Lesson");
    return res.data;
  },

  getById: async (id: string | number): Promise<LessonResponse> => {
    const res = await api.get(`/Lesson/${id}`);
    return res.data;
  },

  create: async (data: LessonUpdateRequest): Promise<LessonResponse> => {
    const res = await api.post("/Lesson", data);
    return res.data;
  },

  update: async (id: string | number, data: LessonUpdateRequest): Promise<void> => {
    await api.put(`/Lesson/${id}`, data);
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/Lesson/${id}`);
  },

  getPage: async (params: LessonRequest) => {
    const res = await api.get("/Lesson/get-page", { params });
    return res.data;
  },

  count: async (): Promise<number> => {
    const res = await api.get("/Lesson/count");
    return res.data;
  },

  getByCourseId: async (courseId: number): Promise<LessonResponse[]> => {
    const res = await api.get(`/Lesson/get-lessons-in-course/${courseId}`);
    return res.data;
  }
};

export default lessonApi;