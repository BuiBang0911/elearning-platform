import type {
    ICategory,
    ICourse,
    IHeroSlide,
    IInstructor,
} from "../interfaces";

export const courses: ICourse[] = [
    {
        id: "1",
        title: "Mastering Adobe Illustrator for Beginners",
        instructor: "John Carter",
        price: 19.99,
        originalPrice: 99.99,
        rating: 4.8,
        image: "/assets/images/course-1.png",
        description:
            "Learn Adobe Illustrator from scratch with practical projects.",
        bestseller: true,
        sale: "80%",
        category: "Adobe Illustrator",
        href: "",
    },
    {
        id: "2",
        title: "Adobe Photoshop Photo Editing Masterclass",
        instructor: "Emma Watson",
        price: 24.99,
        originalPrice: 129.99,
        rating: 4.7,
        image: "/assets/images/course-2.png",
        description: "Professional photo editing techniques in Photoshop.",
        bestseller: false,
        category: "Adobe Photoshop",
        href: "",
    },
];

export const categories: ICategory[] = [
    { id: "1", name: "All Recommendation", slug: "all-recommendation" },
    { id: "2", name: "Adobe Illustrator", slug: "adobe-illustrator" },
    { id: "3", name: "Adobe Photoshop", slug: "adobe-photoshop" },
    { id: "4", name: "UI Design", slug: "ui-design" },
    { id: "5", name: "Web Programming", slug: "web-programming" },
    { id: "6", name: "Mobile Programming", slug: "mobile-programming" },
    { id: "7", name: "Backend Development", slug: "backend-development" },
    { id: "8", name: "Vue JS", slug: "vue-js" },
];

export const slides: IHeroSlide[] = [
    {
        id: 1,
        title: "Master tomorrow's skills today",
        subtitle:
            "Power up your AI, career, and life skills with the most up-to-date, expert-led learning.",
        buttonText: "Get Personal Plan",
        image: "/assets/images/hero-image-1.png",
    },
    {
        id: 2,
        title: "Confidently build your career",
        subtitle:
            "Take your next step with the skills of today (and tomorrow). Courses from ₫259,000 ends Feb 13.",
        buttonText: "View Courses",
        image: "/assets/images/hero-image-2.jpg",
    },
    {
        id: 3,
        title: "Come teach with us",
        subtitle: "Become an instructor and change lives — including your own",
        buttonText: "Get Started",
        image: "/assets/images/hero-image-3.webp",
    },
];

export const instructors: IInstructor[] = [
    {
        id: "1",
        name: "Alex Nguyen",
        description: "Senior Frontend Engineer",
        image: "/assets/images/instructor-1.png",
        bio: "10+ years experience in React, Vue, and UI architecture.",
        students: 12500,
    },
];
