import type { ICourse } from "../../interfaces";
import { FaRegUser } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";

export default function Course({ course }: { course: ICourse }) {
    const {
        title,
        instructor,
        price,
        originalPrice,
        rating,
        image,
        description,
        bestseller,
        sale,
        href,
    } = course;
    console.log(bestseller);
    return (
        <>
            <div className="w-[calc((100%-60px)/4)]">
                <a href={href} className="cursor-pointer relative">
                    <img
                        src={image}
                        alt=""
                        className="rounded-[23px] w-100 h-auto"
                    />
                    <div className="mt-2 px-2.5">
                        <h3 className="text-[16px] font-semibold leading-[1.3] text-black">
                            {title}
                        </h3>
                        <div className="mt-2 flex items-center gap-1">
                            <FaRegUser className="text-[16px] text-[#1B1B1B]" />
                            <span className="text-[14px] text-[#1B1B1B]">
                                {instructor}
                            </span>
                        </div>
                        <p className="mt-2 text-[14px] text-[#1B1B1B]">
                            {description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <FaStar className="text-[14px] text-[#FFD130]" />
                                <FaStar className="text-[14px] text-[#FFD130]" />
                                <FaStar className="text-[14px] text-[#FFD130]" />
                                <FaStar className="text-[14px] text-[#FFD130]" />
                                <FaRegStar className="text-[14px] text-[#1B1B1B]" />
                            </div>
                            <span className="text-[14px] text-[#1B1B1B] font-semibold">
                                {rating}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-[20px] text-[#1B1B1B] font-semibold">
                                ${price}
                            </span>
                            <span className="text-[16px] text-[#1B1B1B]/60 line-through">
                                ${originalPrice}
                            </span>
                        </div>
                    </div>
                    {bestseller && (
                        <div className="absolute top-2 left-2.5 z-20 flex gap-3">
                            <p className="p-1 rounded-[23px] text-[8px] text-white font-semibold bg-[#3DCBB1] flex items-center justify-center min-w-12.5">
                                Best Seller
                            </p>
                            <p className="p-1 rounded-[23px] text-[8px] text-white font-semibold bg-[#A04AE3] flex items-center justify-center min-w-12.5">
                                {sale}
                            </p>
                        </div>
                    )}
                </a>
            </div>
        </>
    );
}
