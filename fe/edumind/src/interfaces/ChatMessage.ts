import type { BaseDto, PagingRequest } from ".";

export type ChatRole = "User" | "AiAssistant";

export interface ChatMessageRequest extends PagingRequest {
  sessionId: number;
  role: ChatRole;
  content: string;
}

export interface ChatMessageResponse extends BaseDto {
  role: ChatRole;
  content: string;
  createdAt: string; 
}

export interface ChatMessageUpdateRequest {
  sessionId: number;
  role: ChatRole;
  content: string;
}

export interface ChatHistoryForAi {
  role: ChatRole;      
  content: string;
}

export interface QueryRequest {
  question: string;            
  chat_history: ChatHistoryForAi[]; 
}

export interface QueryResponse {
  answer: string;
  sources: string[];
}