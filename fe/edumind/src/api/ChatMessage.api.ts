import type { ChatMessageResponse } from "../interfaces/ChatMessage"
import api from "./index.api"


const getBySessionId = async (
  sessionId: number): Promise<ChatMessageResponse[]> => {
  const res = await api.get(`/ChatMessage/session/${sessionId}`)
  return res.data
}

const sendMessageToAskAi = async (
  sessionId: number, message: string): Promise<ChatMessageResponse> => {
  const res = await api.post(`/ChatMessage/ask-ai`, { sessionId, message })
  return res.data
}

const chatMessageApi = {
  getBySessionId,
  sendMessageToAskAi
}

export default chatMessageApi;