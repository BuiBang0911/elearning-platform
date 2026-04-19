import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instructorRequestApi, { type InstructorRequestStatus } from "../../api/instructorRequest.api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";

const ApplyInstructor: React.FC = () => {
    const [specialty, setSpecialty] = useState("");
    const [experience, setExperience] = useState("");
    const [portfolioUrl, setPortfolioUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState<InstructorRequestStatus | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const data = await instructorRequestApi.getMyStatus();
                setStatusData(data);
            } catch (error) {
                // If 404, it means no request yet
                console.log("No existing request found.");
            } finally {
                setCheckingStatus(false);
            }
        };
        checkStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await instructorRequestApi.apply({ specialty, experience, portfolioUrl });
            toast.success("Application submitted successfully! Please wait for admin approval.");
            // Refresh status
            const data = await instructorRequestApi.getMyStatus();
            setStatusData(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit application.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="flex justify-center items-center min-h-[600px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (statusData && statusData.status === "Pending") {
        return (
            <div className="max-w-2xl mx-auto my-20 p-8 bg-white shadow-xl rounded-2xl border border-orange-100 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Pending</h2>
                <p className="text-gray-600 mb-8">
                    Your application to become an instructor is currently being reviewed by our administration team.
                    We will notify you once a decision has been made.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-left inline-block w-full">
                    <p><strong>Submitted on:</strong> {new Date(statusData.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                    onClick={() => navigate("/")}
                    className="mt-10 px-8 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all font-medium"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (statusData && statusData.status === "Rejected") {
        return (
            <div className="max-w-2xl mx-auto my-20 p-8 bg-white shadow-xl rounded-2xl border border-red-100 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Application Declined</h2>
                <p className="text-gray-600 mb-4">
                    Unfortunately, your application was not approved at this time.
                </p>
                {statusData.adminNote && (
                    <div className="bg-red-50 p-4 rounded-lg text-sm text-left mb-8 border border-red-200">
                        <p className="font-bold text-red-800 mb-1">Feedback from Admin:</p>
                        <p className="text-red-700">{statusData.adminNote}</p>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => setStatusData(null)}
                        className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-medium transition-transform active:scale-95"
                    >
                        Re-apply Now
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium transition-transform active:scale-95"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-4xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row border border-white/20 backdrop-blur-sm">
                <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-purple-700 p-10 text-white flex flex-col justify-center relative overflow-hidden">
                    {/* Home Button */}
                    <button 
                        onClick={() => navigate("/")}
                        className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors z-20 group text-sm font-medium"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Home
                    </button>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                    <h1 className="text-4xl font-extrabold mb-6 leading-tight relative z-10">Join Our Teaching Community</h1>
                    <p className="text-blue-50 text-lg mb-8 relative z-10">
                        Share your knowledge with thousands of students worldwide. We provide the tools, you provide the expertise.
                    </p>
                    <ul className="space-y-4 text-sm relative z-10">
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                            Build your personal brand
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                            Earn revenue from your courses
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</span>
                            Impact lives through education
                        </li>
                    </ul>
                </div>
                <div className="md:w-2/3 p-10 bg-white/50">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Tell us about yourself</h2>
                    <p className="text-gray-500 text-sm mb-8">Fill in your professional details to apply for an instructor account.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Primary Specialty</label>
                            <input
                                type="text"
                                placeholder="e.g. Fullstack Development, Graphic Design"
                                value={specialty}
                                onChange={(e) => setSpecialty(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Teaching/Professional Experience</label>
                            <textarea
                                placeholder="Tell us about your background and why you want to teach..."
                                rows={4}
                                value={experience}
                                onChange={(e) => setExperience(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50/50 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Portfolio / LinkedIn URL</label>
                            <input
                                type="url"
                                placeholder="http://linkedin.com/in/yourname"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                        <div className="pt-4">
                            <Button
                                type="submit"
                                loading={loading}
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 hover:-translate-y-0.5 active:scale-[0.98] shadow-blue-200 hover:shadow-blue-300 text-lg font-bold"
                            >
                                Submit Application
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplyInstructor;
