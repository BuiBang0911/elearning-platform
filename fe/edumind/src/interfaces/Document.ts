import type { BaseDto, PagingRequest } from ".";

export interface DocumentRequest extends PagingRequest {
    lessonId?: number;
    fileName?: string;
    filePath?: string;
}

export interface DocumentResponse extends BaseDto {
    lessonId: number;
    fileName: string;
    filePath: string;
    uploadedAt: string; // DateTime -> ISO string
    status: FileStatus;
    size: number;
}

export interface DocumentUpdateRequest {
    lessonId?: number;
    fileName?: string;
    status: FileStatus;
    file: File;
}

export const FileStatus = {
    Idle: 0,
    Uploading: 1,
    Uploaded: 2,
    Processing: 3,
    Processed: 4,
    Failed: 5
} as const;

export type FileStatus = typeof FileStatus[keyof typeof FileStatus];

export const FileStatusConfig: Record<
  FileStatus,
  { label: string; className: string }
> = {
  0: {
    label: "Idle",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  1: {
    label: "Uploading...",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  2: {
    label: "Uploaded",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  3: {
    label: "AI Embedding...",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse",
  },
  4: {
    label: "Ready for AI",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  5: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300",
  },
};