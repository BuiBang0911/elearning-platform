import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, ShoppingCart, Loader2 } from "lucide-react";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { Card } from "../../components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import AdminApi from "../../api/admin.api";
import type { AdminRevenueOverview } from "../../interfaces/Payment";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const AdminRevenueOverviewPage = () => {
    const [data, setData] = useState<AdminRevenueOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await AdminApi.getRevenueOverview();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading || !data) {
        return <FullPageLoader isFullPage={false} />;
    }

    const cards = [
        { label: "Tổng doanh thu", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "bg-blue-500", bg: "bg-blue-50" },
        { label: "Nền tảng (30%)", value: formatCurrency(data.platformRevenue), icon: TrendingUp, color: "bg-purple-500", bg: "bg-purple-50" },
        { label: "Giáo viên (70%)", value: formatCurrency(data.teacherRevenue), icon: Users, color: "bg-green-500", bg: "bg-green-50" },
        { label: "Tổng đơn hàng", value: data.totalOrders.toString(), icon: ShoppingCart, color: "bg-orange-500", bg: "bg-orange-50" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tổng quan doanh thu</h1>
                <p className="text-slate-500">Thống kê doanh thu toàn nền tảng</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <Card key={i} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`${card.color} p-3 rounded-2xl text-white`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Pending Withdrawals Alert */}
            {data.pendingWithdrawals > 0 && (
                <Card className="p-6 border-none shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-l-amber-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-amber-800">Yêu cầu rút tiền đang chờ</h3>
                            <p className="text-sm text-amber-600">{data.pendingWithdrawals} yêu cầu • Tổng: {formatCurrency(data.pendingWithdrawalAmount)}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Revenue Chart */}
            <Card className="p-8 border-none shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Doanh thu theo tháng</h3>
                <p className="text-slate-500 text-sm mb-8">6 tháng gần nhất</p>
                <div className="h-[350px]">
                    {data.monthlyRevenue.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyRevenue}>
                                <defs>
                                    <linearGradient id="adminColorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis
                                    axisLine={false} tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#adminColorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <p>Chưa có dữ liệu doanh thu</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AdminRevenueOverviewPage;
