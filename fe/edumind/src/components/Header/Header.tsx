import { IoSearch } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";

export default function Header() {
    return (
        <>
            <header className="flex items-center py-2.5">
                {/* Logo */}
                <div className="flex items-center gap-1.5">
                    <img src="/favicon.svg" alt="Edumind" />

                    <span className="text-xl font-bold text-[#000000]">
                        EDUMIND
                    </span>
                </div>
                {/* Search */}
                <div className="flex items-center bg-gray-50 rounded-[3px] ml-auto px-3 py-2 w-100">
                    <input
                        type="text"
                        placeholder="Search for course"
                        className="ml-2 bg-transparent outline-none text-sm w-full"
                    />
                    <IoSearch className="text-[#1B1B1B] text-[21px] cursor-pointer" />
                </div>
                {/* Actions */}
                <div className="flex items-center">
                    <button className="ml-7.25 text-[#1B1B1B] cursor-pointer">
                        Become Instructor
                    </button>
                    <button className="p-2 rounded-lg cursor-pointer ml-5.5">
                        <FaShoppingCart className="w-5 h-5 text-[#1B1B1B]" />
                    </button>
                    <button className="px-4 py-2 border border-[#1B1B1B] rounded-xl text-[#1B1B1B] ml-[17.5px] cursor-pointer hover:opacity-90 transition-all">
                        <span>Login</span>
                    </button>
                    <button className="px-4 py-2 border-[none] bg-orange-500 rounded-xl text-white ml-[17.5px] cursor-pointer hover:opacity-90 transition-all">
                        Sign Up
                    </button>
                </div>
            </header>
        </>
    );
}
