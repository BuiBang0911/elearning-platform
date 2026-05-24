import React from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu,
  ChevronRight,
  Banknote,
  DollarSign,
  UserPlus
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

const AdminLayout = () => {
  const { logout: clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
    { icon: UserPlus, label: "Teacher Requests", path: "/admin/instructor-requests" },
    { icon: Banknote, label: "Withdrawals", path: "/admin/withdrawals" },
    { icon: DollarSign, label: "Revenue", path: "/admin/revenue" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <img src="/assets/images/logo.png" alt="EduMind" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? "text-white" : "group-hover:text-blue-400 transition-colors"}`} />
              <span className="font-medium">{item.label}</span>
              {location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b h-20 flex items-center px-8 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 md:hidden text-slate-900">
             <Menu className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {menuItems.find(item => item.path === location.pathname)?.label || "Administration"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-700">Administrator</span>
              <span className="text-xs text-slate-500">System Root</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
              A
            </div>
          </div>
        </header>

        <div className="p-8 relative min-h-[calc(100vh-80px)]">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
