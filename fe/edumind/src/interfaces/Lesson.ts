import type { BaseDto, PagingRequest } from ".";
import type { DocumentResponse } from "./Document";

export interface LessonRequest extends PagingRequest {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
    videoFile?: File,
}

export interface LessonResponse extends BaseDto {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
    videoUrl: string | null;
}

export interface LessonUpdateRequest {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
    videoFile?: File,
}

export interface LessonByStudent extends LessonResponse {
  isCompleted: boolean;
  videoUrl: string | null;
  documents: DocumentResponse[];
}