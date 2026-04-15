import type { BaseDto, PagingRequest } from ".";
import type { LessonByStudent } from "./Lesson";

export interface CourseRequest extends PagingRequest {
	title?: string;
	description?: string;
	lecturerId?: number | null;
	thumbnail: File | null;
	level: CourseLevel;
	rating: number;
	categoryId?: number;
	price: number;
}


export interface CourseResponse extends BaseDto {
	title: string;
	description: string;
	lecturerId?: number | null;
	lectureName?: string;
	createdAt: string; // DateTime -> string (ISO)
	thumbnail: string; // URL to the thumbnail image
	level: CourseLevel;
	rating: number;
	categoryName: string;
	categoryId?: number;
	price: number;
}


export interface CourseResponseInstructorDashboard extends CourseResponse {
	students: number;
}

export interface CourseUpdateRequest {
	title?: string;
	description?: string;
	lecturerId?: number | null;
	thumbnail: File | null;
	level: CourseLevel;
	categoryId?: number;
	price: number;
}


export interface CourseByStudentDashboard {
	id: number;
	title: string;
	joinAt: string; // DateTime → string (ISO)
	lessons: LessonByStudent[];
}

export interface CourseForStudent {
	id: number;
	title: string;
	description: string;
	instructorName?: string;
	createdAt: string;
	thumbnail: string;
	level: CourseLevel;
	rating: number;
	categoryName?: string;
	progress: number;
}

export interface UpdateRatingRequest {
	courseId: number;
	rating: number;
}

export interface CourseListDto extends CourseResponse {
	isEnrolled: boolean;
	progress: number;
	totalStudents: number;
	price: number;
}

export interface CourseDetailForStudentDto extends CourseResponse {
	isEnrolled: boolean;
	progress: number;
	totalStudents: number;
	price: number;
	lessons: LessonByStudent[];
}

export const CourseLevel = {
	BEGINNER: 0,
	INTERMEDIATE: 1,
	ADVANCED: 2
} as const;

export type CourseLevel = typeof CourseLevel[keyof typeof CourseLevel];

export const getCourseLevelName = (level: CourseLevel) => {
	return Object.keys(CourseLevel).find(
		key => CourseLevel[key as keyof typeof CourseLevel] === level
	);
};