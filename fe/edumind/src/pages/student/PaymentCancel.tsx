import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import HeaderStudent from "../../components/Student/HeaderStudent";

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <HeaderStudent />
            <div className="max-w-2xl mx-auto px-4 py-16">
                <Card className="p-8 text-center border-none shadow-lg">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Thanh toán bị hủy
                    </h1>
                    <p className="text-slate-500 mb-8">
                        Giao dịch đã bị hủy. Bạn có thể quay lại và thử lại bất cứ lúc nào.
                    </p>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
                        <p className="text-amber-800 text-sm">
                            <strong>Lưu ý:</strong> Không có khoản phí nào bị trừ. Nếu bạn gặp vấn đề khi thanh toán,
                            vui lòng liên hệ hỗ trợ qua email: support@edumind.com
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="gap-2 h-12 px-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại khóa học
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default PaymentCancel;
