import type { ChatSessionResponse } from "../interfaces/ChatSession"
import api from "./index.api"

export const getAll = async (
): Promise<ChatSessionResponse[]> => {
  const res = await api.get("/ChatSession/get-list-by-current-user")
  return res.data
}