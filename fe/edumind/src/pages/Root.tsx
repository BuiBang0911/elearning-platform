import { Outlet } from "react-router";
import { AuthProvider } from "../context/AuthContext";

export default function Root() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </div>
  );
}
