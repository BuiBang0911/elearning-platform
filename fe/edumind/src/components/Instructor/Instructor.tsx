import type { IInstructor } from "../../interfaces";

export default function Instructor({
    instructor,
}: {
    instructor: IInstructor;
}) {
    const { name, description, image } = instructor;
    return (
        <>
            <div className="w-[calc((100%-60px)/4)] rounded-[18px] overflow-hidden relative">
                <img src={image} alt={name} className="w-full" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-60 text-center">
                    <p className="text-[20px] leading-[1.3] text-[#1B1B1B] font-semibold">
                        {name}
                    </p>
                    <p className="mt-1 text-[#1B1B1B]">{description}</p>
                </div>
            </div>
        </>
    );
}
