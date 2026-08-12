export interface DashboardKpis {
  todayRevenue: number;
  todayOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockItems: number;
  totalOrders: number;
  totalRevenue: number;
  activeDeliveries: number;
  totalDeliveryPeople: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  activeDeliveries: number;
  totalDeliveryPeople: number;
  averageOrderValue: number;
  todayOrders?: number;
  cancelledOrders?: number;
  lowStockItems?: number;
}

export interface RevenueDayPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItemStat {
  foodId: string;
  foodName: string;
  category?: string;
  quantity: number;
  revenue: number;
}

export interface TopCategoryStat {
  category: string;
  quantity: number;
  revenue: number;
}

export interface OrdersByStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  ready_for_pickup: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  assigned?: number;
}

export interface PaymentMethodStat {
  method: string;
  count: number;
  amount: number;
}

export interface PaymentSummary {
  paidCount: number;
  unpaidCount: number;
  paidAmount: number;
  unpaidAmount: number;
  byMethod: PaymentMethodStat[];
}

export interface DashboardSales {
  period: string;
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  revenueByDay: RevenueDayPoint[];
  topItems: TopItemStat[];
  topCategories: TopCategoryStat[];
  ordersByStatus: OrdersByStatus;
  paymentSummary: PaymentSummary;
}

export interface DashboardRecentOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt?: string;
  itemCount: number;
}

export interface DashboardOverview {
  restaurant: {
    id: string;
    name: string;
    cuisine?: string;
    address?: string;
  };
  kpis: DashboardKpis;
  sales: DashboardSales;
  recentOrders: DashboardRecentOrder[];
  topItems: TopItemStat[];
  topCategories: TopCategoryStat[];
  ordersByStatus: OrdersByStatus;
  paymentSummary: PaymentSummary;
}

export interface OrderAnalytics {
  ordersByStatus: OrdersByStatus;
  revenueByDay: RevenueDayPoint[];
  topItems: TopItemStat[];
  topCategories?: TopCategoryStat[];
  paymentSummary?: PaymentSummary;
  totalRevenue?: number;
  totalOrders?: number;
}

export interface DeliveryPerson {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  currentDeliveries: number;
  totalDeliveries: number;
  rating: number;
}

export interface DeliveryStats {
  active?: number;
  completed?: number;
  cancelled?: number;
}

export type SalesPeriod = 'today' | 'yesterday' | '7days' | '30days' | 'custom';
