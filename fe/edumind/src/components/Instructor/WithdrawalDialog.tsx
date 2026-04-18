import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Banknote, Loader2 } from "lucide-react";
import WalletApi from "../../api/Wallet.api";
import { toast } from "sonner";

interface WithdrawalDialogProps {
    balance: number;
    minAmount?: number;
    onSuccess: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const WithdrawalDialog = ({ balance, minAmount = 0, onSuccess }: WithdrawalDialogProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountName: "",
    });

    const handleSubmit = async () => {
        const amount = Number(formData.amount);
        if (!amount || amount < minAmount) {
            toast.error(`Minimum withdrawal amount is ${formatCurrency(minAmount)}`);
            return;
        }
        if (amount > balance) {
            toast.error("Insufficient balance");
            return;
        }
        if (!formData.bankName || !formData.bankAccountNumber || !formData.bankAccountName) {
            toast.error("Please fill in all bank details");
            return;
        }

        setLoading(true);
        try {
            await WalletApi.requestWithdrawal({
                amount,
                bankName: formData.bankName,
                bankAccountNumber: formData.bankAccountNumber,
                bankAccountName: formData.bankAccountName,
            });
            toast.success("Withdrawal request sent successfully!");
            setOpen(false);
            setFormData({ amount: "", bankName: "", bankAccountNumber: "", bankAccountName: "" });
            onSuccess();
        } catch (error: any) {
            const message = error?.response?.data?.message || "An error occurred.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    disabled={balance < minAmount}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                    <Banknote className="w-4 h-4" />
                    Request Withdrawal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Withdrawal Request</DialogTitle>
                    <DialogDescription>
                        Current balance: <strong className="text-green-600">{formatCurrency(balance)}</strong>
                        <br />
                        Minimum: {formatCurrency(minAmount)}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Withdrawal Amount (VND)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount..."
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                            id="bankName"
                            placeholder="e.g. Chase, Bank of America..."
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                        <Input
                            id="bankAccountNumber"
                            placeholder="Enter account number..."
                            value={formData.bankAccountNumber}
                            onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bankAccountName">Account Holder Name</Label>
                        <Input
                            id="bankAccountName"
                            placeholder="e.g. JOHN DOE"
                            value={formData.bankAccountName}
                            onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawalDialog;
