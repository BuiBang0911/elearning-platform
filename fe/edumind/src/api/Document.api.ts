import type { PagedList, PagingRequest } from "../interfaces";
import type { DocumentResponse, DocumentUpdateRequest } from "../interfaces/Document";
import api from "./index.api";

const documentApi = {
    create: async (data: DocumentUpdateRequest, onUploadProgress?: (progressEvent: any) => void): Promise<DocumentResponse> => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'file' && value instanceof File) {
                    formData.append(key, value);
                }
                else {
                    formData.append(key, value.toString());
                }
            }
        });

        const res = await api.post("/Document", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress
        });

        return res.data;
    },

    // Lấy danh sách tất cả tài liệu
    getAll: async (): Promise<DocumentResponse[]> => {
        const res = await api.get("/Document");
        return res.data;
    },

    // Cập nhật thông tin tài liệu theo ID
    update: async (id: string | number, data: DocumentUpdateRequest): Promise<DocumentResponse> => {
        const res = await api.put(`/Document/${id}`, data);
        return res.data;
    },

    // Xóa tài liệu theo ID
    remove: async (id: string | number): Promise<void> => {
        await api.delete(`/Document/${id}`);
    },

    // Lấy chi tiết một tài liệu theo ID
    getById: async (id: string | number): Promise<DocumentResponse> => {
        const res = await api.get(`/Document/${id}`);
        return res.data;
    },

    // Lấy danh sách tài liệu phân trang (sử dụng interface PagedList đã tạo)
    getPage: async (page: number, pageSize: number): Promise<PagedList<DocumentResponse>> => {
        const res = await api.get("/Document/get-page", { params: { page, pageSize } });
        return res.data;
    },

    // Lấy tổng số lượng tài liệu
    getCount: async (): Promise<number> => {
        const res = await api.get("/Document/count");
        return res.data;
    },

    getByInstructorId: async (pagingRequest: PagingRequest): Promise<PagedList<DocumentResponse>> => {
        const res = await api.post(`/Document/get-in-instructor`, pagingRequest);
        return res.data;
    }
};

export default documentApi;