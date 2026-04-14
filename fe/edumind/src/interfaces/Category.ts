import type { BaseDto } from ".";

export interface CategoryResponse extends BaseDto {
    name: string;
}

export interface CategoryRequest {
    name: string;
}
