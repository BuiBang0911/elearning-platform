import type { ICourse } from "../../interfaces/index";
import Course from "./Course";

export default function CourseList(props: {
    title: string;
    subTitle: string;
    courses: ICourse[];
}) {
    const { title, subTitle, courses } = props;
    return (
        <>
            <div className="mt-10">
                <h2 className="text-[20px] font-bold leading-[1.3] text-black">
                    {title}
                </h2>
                <p className="text-[#1B1B1B]/60 mt-1">{subTitle}</p>
                <div className="mt-5 flex flex-wrap items-center gap-5">
                    {courses.map((course) => (
                        <Course key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </>
    );
}
