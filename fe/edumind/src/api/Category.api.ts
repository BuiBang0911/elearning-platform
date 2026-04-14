import type { CategoryResponse } from "../interfaces/Category";
import api from "./index.api";

const getAll = async (): Promise<CategoryResponse[]> => {
  const res = await api.get("/Category");
  return res.data;
};

const CategoryApi = {
  getAll,
};

export default CategoryApi;
