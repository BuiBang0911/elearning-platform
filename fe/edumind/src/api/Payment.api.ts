import type { OrderResponse, PaymentLinkResponse } from "../interfaces/Payment";
import api from "./index.api";

const createPaymentLink = async (courseId: number): Promise<PaymentLinkResponse> => {
  const res = await api.post("/Payment/create-link", { courseId });
  return res.data;
};

const verifyPayment = async (orderCode: number): Promise<OrderResponse> => {
  const res = await api.get(`/Payment/verify/${orderCode}`);
  return res.data;
};

const getMyOrders = async (): Promise<OrderResponse[]> => {
  const res = await api.get("/Payment/my-orders");
  return res.data;
};

const PaymentApi = {
  createPaymentLink,
  verifyPayment,
  getMyOrders,
};

export default PaymentApi;
