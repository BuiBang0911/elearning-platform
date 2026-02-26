export interface IHeroSlide {
    id: number;
    title: string;
    subtitle: string;
    buttonText: string;
    image: string;
}

export interface ICategory {
    id: string;
    name: string;
    slug: string;
}

export interface ICourse {
    id: string;
    title: string;
    instructor: string;
    price: number;
    originalPrice: number;
    rating: number;
    image: string;
    description: string;
    bestseller?: boolean;
    sale?: string;
    category?: string;
    href: string;
}

export interface IInstructor {
    id: string;
    name: string;
    description: string;
    image: string;
    bio?: string;
    students?: number;
    courses?: ICourse[];
}

export interface PagingRequest {
  pageNumber?: number;
  pageSize?: number;
}

export interface BaseDto {
  id: number;
}