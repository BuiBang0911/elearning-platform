import type { IInstructor } from "../../interfaces";
import Instructor from "./Instructor";

export default function InstructorList(props: {
    title: string;
    subTitle: string;
    instructors: IInstructor[];
}) {
    const { title, subTitle, instructors } = props;
    return (
        <>
            <div className="mt-10">
                <h2 className="text-[20px] font-bold leading-[1.3] text-black">
                    {title}
                </h2>
                <p className="text-[#1B1B1B]/60 mt-1">{subTitle}</p>
                <div className="mt-5 flex flex-wrap items-center gap-5">
                    {instructors.map((instrutor) => (
                        <Instructor key={instrutor.id} instructor={instrutor} />
                    ))}
                </div>
            </div>
        </>
    );
}
