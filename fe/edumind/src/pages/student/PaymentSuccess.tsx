import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import PaymentApi from "../../api/Payment.api";
import type { OrderResponse } from "../../interfaces/Payment";
import HeaderStudent from "../../components/Student/HeaderStudent";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const orderCode = searchParams.get("orderCode");

    useEffect(() => {
        const verifyOrder = async () => {
            if (!orderCode) {
                setLoading(false);
                return;
            }
            try {
                const data = await PaymentApi.verifyPayment(Number(orderCode));
                setOrder(data);
            } catch (error) {
                console.error("Failed to verify payment:", error);
            } finally {
                setLoading(false);
            }
        };
        verifyOrder();
    }, [orderCode]);

    return (
        <div className="min-h-screen bg-slate-50">
            <HeaderStudent />
            <div className="max-w-2xl mx-auto px-4 py-16">
                <Card className="p-8 text-center border-none shadow-lg">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                            <p className="text-slate-500">Đang xác nhận thanh toán...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Thanh toán thành công!
                            </h1>
                            <p className="text-slate-500 mb-8">
                                Cảm ơn bạn đã mua khóa học. Bạn có thể bắt đầu học ngay bây giờ.
                            </p>

                            {order && (
                                <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Khóa học</span>
                                        <span className="font-semibold text-slate-800">{order.courseTitle}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Số tiền</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(order.amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Trạng thái</span>
                                        <span className={`font-semibold ${order.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {order.status === 'Completed' ? '✅ Đã thanh toán' : '⏳ Đang xử lý'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Mã đơn hàng</span>
                                        <span className="font-mono text-sm text-slate-600">#{orderCode}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {order && (
                                    <Button
                                        onClick={() => navigate(`/student/course/${order.courseId}/learn`)}
                                        className="gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        Bắt đầu học
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/student")}
                                    className="gap-2 h-12 px-8"
                                >
                                    Về Dashboard
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default PaymentSuccess;
