import type { LoginRequest, LoginResponse } from "../interfaces/auth"
import api from "./index.api"

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", data)
  return res.data
}