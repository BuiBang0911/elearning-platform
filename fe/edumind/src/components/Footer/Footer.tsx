import { FaTwitter, FaInstagram, FaFacebookF } from "react-icons/fa";

export default function Footer() {
    return (
        <>
            <div className="mt-20 bg-[#1B1B1B] pt-10 pb-6">
                <div className="container mx-auto">
                    <div className="flex items-start gap-42">
                        <div className="flex items-center gap-1.5">
                            <img src="/favicon.svg" alt="Edumind" />

                            <span className="text-xl font-bold text-white">
                                EDUMIND
                            </span>
                        </div>
                        <ul className="flex flex-col gap-4">
                            <li>
                                <a href="#" className="text-white">
                                    Web Programming
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Mobile Programming
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Java Beginner
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    PHP Beginner
                                </a>
                            </li>
                        </ul>
                        <ul className="flex flex-col gap-4">
                            <li>
                                <a href="#" className="text-white">
                                    Adobe Illustrator
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Adobe Photoshop
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Design Logo
                                </a>
                            </li>
                        </ul>
                        <ul className="flex flex-col gap-4">
                            <li>
                                <a href="#" className="text-white">
                                    Writing Course
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Photography
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white">
                                    Video Making
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="w-full h-px bg-[#F9F9F9]/8 mt-15"></div>
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-[#F9F9F9]/60">
                            Copyright © Edumind 2026. All Rights Reserved
                        </p>
                        <ul className="flex items-center gap-6">
                            <li>
                                <a href="#" className="text-white text-[20px]">
                                    <FaTwitter />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white text-[20px]">
                                    <FaInstagram />
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white text-[20px]">
                                    <FaFacebookF />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
