import api from "./index.api";

export interface InstructorApplyRequest {
  specialty: string;
  experience: string;
  portfolioUrl: string;
}

export interface InstructorRequestStatus {
  status: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

const instructorRequestApi = {
  apply: async (data: InstructorApplyRequest) => {
    const response = await api.post(`/InstructorRequest/apply`, data);
    return response.data;
  },
  getMyStatus: async () => {
    const response = await api.get<InstructorRequestStatus>(`/InstructorRequest/my-status`);
    return response.data;
  },
  getPending: async () => {
    const response = await api.get(`/InstructorRequest/admin/pending`);
    return response.data;
  },
  process: async (id: number, status: number, adminNote?: string) => {
    const response = await api.post(`/InstructorRequest/admin/${id}/process`, { status, adminNote });
    return response.data;
  }
};

export default instructorRequestApi;
