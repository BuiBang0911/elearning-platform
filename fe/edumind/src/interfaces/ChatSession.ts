import type { BaseDto, PagingRequest } from ".";

export interface ChatSessionRequest extends PagingRequest {
  userId: number;
  title?: string;
}

export interface ChatSessionResponse extends BaseDto {
  userId: number;
  title: string;
  createdAt: string;
  lessonId?: number;
  courseId?: number;
}

export interface ChatSessionUpdateRequest {
  userId: number;
  title: string;
  lessonId?: number;
}