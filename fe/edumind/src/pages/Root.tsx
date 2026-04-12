import { Outlet } from "react-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Toaster } from "../components/ui/sonner";
import AiAssistant from "../components/AiAssistant/AiAssistant";
import { UserRole } from "../interfaces/auth";

const ConditionalAiAssistant = () => {
  const { user } = useAuth();
  
  // Chỉ hiện Chatbot cho học sinh
  if (user?.role === UserRole.STUDENT) {
    return <AiAssistant />;
  }
  
  return null;
};

export default function Root() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthProvider>
        <Outlet />
        <ConditionalAiAssistant />
        <Toaster />
      </AuthProvider>
    </div>
  );
}
