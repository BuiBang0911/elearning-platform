import type { BaseDto, PagingRequest } from ".";

export interface LessonRequest extends PagingRequest {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
}

export interface LessonResponse extends BaseDto {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
}

export interface LessonUpdateRequest {
    courseId: number;
    title: string;
    lessonOrder: number;
    description: string,
    content: string,
}

export interface LessonByStudent extends LessonResponse {
  isCompleted: boolean;
}