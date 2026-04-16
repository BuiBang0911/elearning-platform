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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50">
        <AuthProvider>
          <Outlet />
          <ConditionalAiAssistant />
          <Toaster />
        </AuthProvider>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
