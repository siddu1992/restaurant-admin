import { Food } from './food.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'ready'
  | 'out_for_delivery'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'assigned';

export type PaymentFilter = 'all' | 'paid' | 'unpaid';

export interface OrderItem {
  food: Food | string;
  quantity: number;
  price: number;
  _id?: string;
}

export interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  restaurant: string | { _id: string; name?: string };
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  paymentMethod?: string;
  specialInstructions?: string;
  delivery?: { _id: string; status?: string };
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  pincode?: string;
}

export interface OrderSearchParams {
  status?: string;
  payment?: PaymentFilter | string;
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSearchResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

/**
 * Restaurant kitchen flow (merchant POS):
 * Incoming → Accept (start cooking + dispatch rider) / Decline
 * In kitchen → Food is ready
 * Ready / courier assigned → wait (rider marks pickup)
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: [],
  ready: [],
  assigned: [],
  out_for_delivery: [],
  picked_up: [],
  delivered: [],
  cancelled: [],
};

export function getNextOrderStatuses(status: OrderStatus): OrderStatus[] {
  if (status === 'ready') {
    return ORDER_STATUS_TRANSITIONS.ready_for_pickup;
  }
  return ORDER_STATUS_TRANSITIONS[status] || [];
}

export function isIncomingOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function getOrderItemName(item: OrderItem): string {
  if (typeof item.food === 'string') {
    return 'Item';
  }
  return item.food?.name || 'Item';
}

export function getOrderItemUnitPrice(item: OrderItem): number {
  return item.price || 0;
}
