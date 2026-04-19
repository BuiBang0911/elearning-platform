import { IoSearch } from "react-icons/io5";
import { FaShoppingCart, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <>
            <header className="flex items-center py-2.5">
                {/* Logo */}
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate("/")}>
                    <img src="/assets/images/logo.png" alt="Edumind" className="w-14 h-14 object-contain" />
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
                    {user?.role === 1 && ( // Student
                        <button 
                            className="ml-7.25 text-[#1B1B1B] cursor-pointer hover:text-orange-500 transition-colors"
                            onClick={() => navigate("/apply-instructor")}
                        >
                            Become Instructor
                        </button>
                    )}
                    
                    {user?.role === 2 && ( // Instructor
                        <button 
                            className="ml-7.25 text-[#1B1B1B] cursor-pointer hover:text-orange-500 transition-colors"
                            onClick={() => navigate("/instructor")}
                        >
                            Instructor Dashboard
                        </button>
                    )}

                    <button className="p-2 rounded-lg cursor-pointer ml-5.5">
                        <FaShoppingCart className="w-5 h-5 text-[#1B1B1B]" />
                    </button>
                    
                    {user ? (
                        <div className="flex items-center ml-[17.5px] gap-3">
                            <div className="flex items-center gap-2 cursor-pointer group relative">
                                <FaUserCircle className="w-8 h-8 text-gray-600" />
                                <span className="text-sm font-medium">{user.fullName}</span>
                                
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden hidden group-hover:block border z-50">
                                    <button 
                                        onClick={logout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button className="px-4 py-2 border border-[#1B1B1B] rounded-xl text-[#1B1B1B] ml-[17.5px] cursor-pointer hover:bg-gray-50 transition-all" onClick={() => navigate("/login")}>
                                <span>Login</span>
                            </button>
                            <button className="px-4 py-2 border-[none] bg-orange-500 rounded-xl text-white ml-[17.5px] cursor-pointer hover:opacity-90 transition-all" onClick={() => navigate("/register")}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </header>
        </>
    );
}
