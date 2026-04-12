import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      
      if (originalRequest.url.includes("/auth/refresh") || originalRequest.url.includes("/auth/login") || originalRequest.url.includes("/auth/register")) {
        return Promise.reject(error);
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await refreshApi.post("/auth/refresh"); 

          return api(originalRequest);
        } catch (refreshError) {
          const publicPaths = ["/login", "/", "/register"];
          if (!publicPaths.includes(window.location.pathname)) {
              window.location.href = "/login"; 
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;