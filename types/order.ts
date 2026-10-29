import type { BackendManga } from "./manga";

export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  mangaId: string;
  quantity: number;
  unitPrice: number | string;
  createdAt: string;
  updatedAt: string;
  manga?: BackendManga;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number | string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}

export interface CreateOrderItemInput {
  mangaId: string;
  quantity: number;
}

