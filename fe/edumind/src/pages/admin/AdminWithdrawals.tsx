import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Banknote, Search, Loader2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import AdminApi from "../../api/admin.api";
import type { WithdrawalResponse } from "../../interfaces/Payment";
import { toast } from "sonner";
import { format } from "date-fns";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    Pending: { label: "Đang chờ", color: "bg-amber-100 text-amber-800", icon: Clock },
    Approved: { label: "Đã duyệt", color: "bg-green-100 text-green-800", icon: CheckCircle },
    Rejected: { label: "Từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
};

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState<WithdrawalResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            const data = await AdminApi.getWithdrawals();
            setWithdrawals(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    const handleApprove = async (id: number) => {
        if (!confirm("Bạn đã chuyển khoản thực tế cho giáo viên? Nhấn OK để xác nhận.")) return;
        setProcessingId(id);
        try {
            await AdminApi.approveWithdrawal(id, "Đã chuyển khoản thành công");
            toast.success("Đã duyệt yêu cầu rút tiền!");
            fetchWithdrawals();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt("Lý do từ chối:");
        if (reason === null) return;
        setProcessingId(id);
        try {
            await AdminApi.rejectWithdrawal(id, reason);
            toast.success("Đã từ chối yêu cầu rút tiền.");
            fetchWithdrawals();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Có lỗi xảy ra!");
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = withdrawals.filter(w =>
        !filter ||
        w.teacherName.toLowerCase().includes(filter.toLowerCase()) ||
        w.bankAccountNumber.includes(filter)
    );

    const pendingCount = withdrawals.filter(w => w.status === "Pending").length;
    const totalPending = withdrawals.filter(w => w.status === "Pending").reduce((s, w) => s + w.amount, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý rút tiền</h1>
                    <p className="text-slate-500">Duyệt và quản lý yêu cầu rút tiền từ giáo viên</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-xs text-amber-600 block">Đang chờ</span>
                        <span className="text-lg font-bold text-amber-800">{pendingCount}</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-500 block">Tổng chờ</span>
                        <span className="text-lg font-bold text-slate-800">{formatCurrency(totalPending)}</span>
                    </div>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="Tìm theo tên hoặc STK..."
                    className="pl-10"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {loading ? (
                <FullPageLoader isFullPage={false} />
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center border-none shadow-sm">
                    <Banknote className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-600">Chưa có yêu cầu rút tiền</h3>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map((w) => {
                        const cfg = statusConfig[w.status] || statusConfig.Pending;
                        const StatusIcon = cfg.icon;
                        return (
                            <Card key={w.id} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-slate-800">{w.teacherName}</h3>
                                            <Badge className={cfg.color}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500">{w.teacherEmail}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                                            <div>
                                                <span className="text-slate-400">Số tiền</span>
                                                <p className="font-bold text-lg text-slate-800">{formatCurrency(w.amount)}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Ngân hàng</span>
                                                <p className="font-medium text-slate-700">{w.bankName}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Số TK</span>
                                                <p className="font-mono text-slate-700">{w.bankAccountNumber}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Chủ TK</span>
                                                <p className="font-medium text-slate-700">{w.bankAccountName}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Ngày yêu cầu: {format(new Date(w.createdAt), "dd/MM/yyyy HH:mm")}
                                            {w.processedAt && ` • Xử lý: ${format(new Date(w.processedAt), "dd/MM/yyyy HH:mm")}`}
                                        </p>
                                        {w.adminNote && (
                                            <p className="text-sm text-slate-500 italic mt-1">📝 {w.adminNote}</p>
                                        )}
                                    </div>

                                    {w.status === "Pending" && (
                                        <div className="flex gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(w.id)}
                                                loading={processingId === w.id}
                                                className="bg-green-600 hover:bg-green-700 gap-1 text-white font-bold"
                                            >
                                                Confirm
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReject(w.id)}
                                                loading={processingId === w.id}
                                                className="text-red-600 border-red-200 hover:bg-red-50 gap-1 font-bold"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
