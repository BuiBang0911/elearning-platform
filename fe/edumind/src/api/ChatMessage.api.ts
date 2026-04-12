import type { ChatMessageResponse } from "../interfaces/ChatMessage"
import api from "./index.api"


const getBySessionId = async (
  sessionId: number): Promise<ChatMessageResponse[]> => {
  const res = await api.get(`/ChatMessage/session/${sessionId}`)
  return res.data
}

const sendMessageToAskAi = async (
  sessionId: number, message: string, lessonId?: number): Promise<ChatMessageResponse> => {
  const res = await api.post(`/ChatMessage/ask-ai`, { sessionId, message, lessonId })
  return res.data
}

const sendMessageToAskAiStream = async (
  sessionId: number,
  message: string,
  onChunk: (chunk: string) => void,
  lessonId?: number
): Promise<void> => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ChatMessage/ask-ai-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Gửi kèm cookies (accessToken) để xác thực
    body: JSON.stringify({ sessionId, message, lessonId })
  });

  if (!response.ok) throw new Error('Network response was not ok');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader found');

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
}

const chatMessageApi = {
  getBySessionId,
  sendMessageToAskAi,
  sendMessageToAskAiStream
}

export default chatMessageApi;