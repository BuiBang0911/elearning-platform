import type {
  TeacherRevenueStats,
  WalletBalance,
  WalletTransaction,
  WithdrawalRequestInput,
} from "../interfaces/Payment";
import api from "./index.api";

const getBalance = async (): Promise<WalletBalance> => {
  const res = await api.get("/Wallet/balance");
  return res.data;
};

const getRevenueStats = async (): Promise<TeacherRevenueStats> => {
  const res = await api.get("/Wallet/revenue-stats");
  return res.data;
};

const getTransactions = async (): Promise<WalletTransaction[]> => {
  const res = await api.get("/Wallet/transactions");
  return res.data;
};

const requestWithdrawal = async (data: WithdrawalRequestInput) => {
  const res = await api.post("/Wallet/withdraw", data);
  return res.data;
};

const WalletApi = {
  getBalance,
  getRevenueStats,
  getTransactions,
  requestWithdrawal,
};

export default WalletApi;
