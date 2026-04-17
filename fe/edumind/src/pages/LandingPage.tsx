import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { BookOpen, Brain, Users, TrendingUp, Sparkles, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole, type UserResponse } from "../interfaces/auth";
import AuthApi from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import instructorRequestApi, { type InstructorRequestStatus } from "../api/instructorRequest.api";

export default function LandingPage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;

  const [instructorStatus, setInstructorStatus] = useState<InstructorRequestStatus | null>(null);

  // Manual redirect logic for specific roles when landing on home
  useEffect(() => {
    if (!loading && user) {
      if (user.role === UserRole.ADMIN) {
        navigate("/admin");
      }
      
      // Fetch instructor request status if student
      if (user.role === UserRole.STUDENT) {
        instructorRequestApi.getMyStatus()
          .then(status => setInstructorStatus(status))
          .catch(() => setInstructorStatus(null));
      }
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduMind
              </span>
            </Link>
            {!isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  How It Works
                </a>
                <Link to="/browse" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Browse Courses
                </Link>
                <a href="#footer" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  About
                </a>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={user?.role === UserRole.STUDENT ? "/student" : user?.role === UserRole.INSTRUCTOR ? "/instructor" : "/admin"}>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    {user?.role === UserRole.INSTRUCTOR ? "Quản lý khóa học" : "Vào học"}
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium hidden sm:inline">{user?.fullName}</span>
                  <Button variant="ghost" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/browse" className="hidden sm:block">
                  <Button variant="ghost">Explore</Button>
                </Link>
                <Link to="/register?role=instructor">
                  <Button variant="ghost" className="hidden md:inline-flex">Teach on EduMind</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Learn Smarter with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Education
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              EduMind combines expert-created courses with intelligent AI assistance using Retrieval-Augmented Generation (RAG) to provide personalized learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={isAuthenticated ? (user?.role === UserRole.STUDENT ? "/student" : user?.role === UserRole.INSTRUCTOR ? "/instructor" : "/admin") : "/register"}>
                <Button size="lg" className="gap-2 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600">
                  <GraduationCap className="w-5 h-5" />
                  {isAuthenticated ? (user?.role === UserRole.INSTRUCTOR ? "Quản lý khóa học" : "Vào học ngay") : "Bắt đầu học ngay"}
                </Button>
              </Link>
              
              {/* Logic cho nút Đăng ký giảng viên */}
              {(!isAuthenticated || user?.role === UserRole.STUDENT) && (
                <Link to={!isAuthenticated ? "/register?role=instructor" : "/apply-instructor"}>
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Users className="w-5 h-5" />
                    {instructorStatus?.status === "Pending" ? "Đang chờ duyệt giảng viên" : "Trở thành Giảng viên"}
                  </Button>
                </Link>
              )}
              
              {isAuthenticated && user?.role === UserRole.INSTRUCTOR && (
                <Link to="/instructor">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50">
                    <TrendingUp className="w-5 h-5" />
                    Kênh giảng viên
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EduMind?</h2>
            <p className="text-lg text-gray-600">Advanced AI technology meets expert instruction</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Learning Assistant</h3>
              <p className="text-gray-600">
                Get instant answers to your questions with our intelligent AI assistant powered by RAG technology. Ask questions, get explanations, and receive personalized recommendations.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert-Created Courses</h3>
              <p className="text-gray-600">
                Learn from industry professionals and academics. Courses include videos, documents, quizzes, and hands-on projects organized into comprehensive modules.
              </p>
            </Card>
            <Card className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed analytics. See your progress, time spent, and get AI-powered suggestions for what to learn next.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How EduMind Works</h2>
            <p className="text-lg text-gray-600">Your AI-powered learning journey in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Enroll in Courses",
                description: "Browse and enroll in courses that match your learning goals",
                icon: BookOpen,
              },
              {
                step: "2",
                title: "Learn at Your Pace",
                description: "Access videos, documents, and exercises anytime, anywhere",
                icon: GraduationCap,
              },
              {
                step: "3",
                title: "Ask AI Assistant",
                description: "Get instant help and explanations from our intelligent AI",
                icon: Brain,
              },
              {
                step: "4",
                title: "Track Progress",
                description: "Monitor your achievements and get personalized recommendations",
                icon: TrendingUp,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mb-4 inline-block">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-blue-600">{item.step}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students already learning with AI-powered assistance
          </p>
          <Link to={isAuthenticated ? (user?.role === UserRole.STUDENT ? "/student" : "/login") : "/register"}>
            <Button size="lg" variant="secondary" className="gap-2">
              <Users className="w-5 h-5" />
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12" id="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">EduMind</span>
              </div>
              <p className="text-sm">AI-powered learning platform for the future of education.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>Courses</li>
                <li>AI Assistant</li>
                <li>For Instructors</li>
                <li>Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2026 EduMind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}