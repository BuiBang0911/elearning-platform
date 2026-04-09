import type { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from "../interfaces/auth"
import api from "./index.api"

const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", data)
  return res.data
}

const logout = async (
): Promise<LoginResponse> => {
  const res = await api.post("/auth/logout")
  return res.data
}

const getMe = async (
): Promise<UserResponse> => {
  const res = await api.get("/auth/get-me")
  return res.data
}

const register = async (
  data: RegisterRequest
): Promise<LoginResponse> => {
  const res = await api.post("/auth/register", data)
  return res.data
}

const AuthApi = {
  login,
  logout,
  getMe,
  register
}

export default AuthApi;