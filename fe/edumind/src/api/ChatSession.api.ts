import type { ChatSessionResponse } from "../interfaces/ChatSession"
import api from "./index.api"

const getAll = async (
): Promise<ChatSessionResponse[]> => {
  const res = await api.get("/ChatSession/get-list-by-current-user")
  return res.data
}

const createNewChat = async (
): Promise<ChatSessionResponse> => {
  const res = await api.post("/ChatSession/create-new-chat")
  return res.data
}

const DeleteNewChat = async (
  id: number
): Promise<ChatSessionResponse> => {
  const res = await api.post(`/ChatSession/delete-current-chat/${id}`)
  return res.data
}

const DeleteChatSession = async (
  id: number
): Promise<ChatSessionResponse> => {
  const res = await api.delete(`/ChatSession/${id}`)
  return res.data
}

const update = async (
  id: number,
  data: Partial<ChatSessionResponse>
): Promise<ChatSessionResponse> => {
  const res = await api.put(`/ChatSession/${id}`, data)
  return res.data
}

const ChatSessionApi = {
  getAll,
  createNewChat,
  DeleteNewChat,
  DeleteChatSession,
  update
}

export default ChatSessionApi;