import type { ChatSessionResponse } from "../interfaces/ChatSession"
import api from "./index.api"

export const getAll = async (
): Promise<ChatSessionResponse[]> => {
  const res = await api.get("/ChatSession/get-list-by-current-user")
  return res.data
}

export const createNewChat = async (
): Promise<ChatSessionResponse> => {
  const res = await api.post("/ChatSession/create-new-chat")
  return res.data
}

export const DeleteNewChat = async (
  id: number
): Promise<ChatSessionResponse> => {
  const res = await api.post(`/ChatSession/delete-current-chat/${id}`)
  return res.data
}

export const DeleteChatSession = async (
  id: number
): Promise<ChatSessionResponse> => {
  const res = await api.delete(`/ChatSession/${id}`)
  return res.data
}