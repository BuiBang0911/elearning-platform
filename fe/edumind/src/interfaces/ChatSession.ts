import type { BaseDto, PagingRequest } from ".";

export interface ChatSessionRequest extends PagingRequest {
  userId: number;
  title?: string;
}

export interface ChatSessionResponse extends BaseDto {
  userId: number;
  title: string;
  createdAt: string;
}

export interface ChatSessionUpdateRequest {
  userId: number;
  title: string;
}