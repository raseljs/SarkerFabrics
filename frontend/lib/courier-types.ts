export type CourierProviderId = "steadfast" | "pathao" | "redx";

export type CourierProvider = {
  id: CourierProviderId;
  name: string;
  configured: boolean;
  missing: string[];
  defaultWeightKg?: number;
  defaultStoreId?: number;
};

export type CourierShipment = {
  provider: CourierProviderId;
  state: "pending" | "booked" | "failed" | "uncertain";
  consignmentId?: string;
  trackingCode?: string;
  trackingUrl?: string;
  providerStatus?: string;
  errorMessage?: string;
  attemptedAt?: string;
  updatedAt?: string;
};

export type AdminCourierOrder = {
  _id: string;
  orderNumber: string;
  createdAt?: string;
  updatedAt?: string;
  customer?: { name?: string; phone?: string; email?: string };
  shippingAddress?: { line1?: string; line2?: string; area?: string; city?: string; district?: string; postalCode?: string };
  items?: Array<{ slug?: string; name: string; image?: string; price: number; quantity: number }>;
  total: number;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  paymentMethod?: "cash_on_delivery" | "online" | "emi";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  deliveryStatus?: "confirmed" | "processing" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  courierPartner?: string;
  trackingId?: string;
  estimatedDelivery?: string;
  notes?: string;
  statusHistory?: Array<{ status: string; note?: string; actor?: string; at: string }>;
  courierShipment?: CourierShipment;
};

export type CourierBookingOptions = {
  storeId?: number;
  cityId?: number;
  zoneId?: number;
  areaId?: number;
  pickupAreaId?: number;
  weight?: number;
};

export type CourierLocation = { id: number; name: string };
export type CourierBookingResult = { orderId: string; success: boolean; message: string; order?: AdminCourierOrder };
export type CourierBookingResponse = { results: CourierBookingResult[]; successful: number; failed: number };

export const courierProviderNames: Record<CourierProviderId, string> = { steadfast: "Steadfast", pathao: "Pathao", redx: "RedX" };

export function courierBookingBlockReason(order: AdminCourierOrder): string | undefined {
  if (order.deliveryStatus === "cancelled" || order.deliveryStatus === "delivered") return "This order is already closed.";
  if (order.courierShipment?.state === "uncertain") return "Check the courier panel and resolve this booking before sending again.";
  if (order.courierShipment?.state === "pending") return "Booking is in progress. Refresh to check the result.";
  if (order.courierShipment?.state === "booked" || order.trackingId?.trim()) return "This order already has a courier booking or tracking number.";
  if (!['confirmed', 'processing', 'packed'].includes(order.deliveryStatus || 'confirmed')) return "Only confirmed, processing or packed orders can be sent.";
  if (order.paymentStatus === 'failed' || order.paymentStatus === 'refunded') return "Resolve the payment status before sending.";
  if (order.paymentMethod && order.paymentMethod !== 'cash_on_delivery' && order.paymentStatus !== 'paid') return "Online orders must be paid before sending.";
  return undefined;
}

export function courierOrderAddress(order: AdminCourierOrder): string {
  const address = order.shippingAddress || {};
  return [address.line1, address.line2, address.area, address.city, address.district, address.postalCode].filter(Boolean).join(", ");
}

export function courierCodAmount(order: AdminCourierOrder): number {
  return order.paymentStatus === "paid" || (order.paymentMethod && order.paymentMethod !== "cash_on_delivery") ? 0 : Math.max(0, Number(order.total) || 0);
}

export function filterCourierOrders(orders: AdminCourierOrder[], query: string, provider: string, state: string): AdminCourierOrder[] {
  const term = query.trim().toLowerCase();
  return orders.filter(order => {
    const shipment = order.courierShipment;
    const haystack = [order.orderNumber, order.customer?.name, order.customer?.phone, courierOrderAddress(order), order.trackingId, shipment?.consignmentId, shipment?.trackingCode].join(" ").toLowerCase();
    const matchesState = state === "all" || (state === "ready" ? !courierBookingBlockReason(order) : state === "in_courier" ? ["pending", "booked", "uncertain"].includes(shipment?.state || "") && !["delivered", "cancelled"].includes(order.deliveryStatus || "") : state === "attention" ? ["failed", "uncertain"].includes(shipment?.state || "") : shipment?.state === state);
    return (!term || haystack.includes(term)) && (provider === "all" || shipment?.provider === provider) && matchesState;
  });
}

export function courierBookingIds(orders: AdminCourierOrder[], selectedIds: string[]): string[] {
  const selected = new Set(selectedIds);
  return orders.filter(order => selected.has(order._id) && !courierBookingBlockReason(order)).map(order => order._id).slice(0, 25);
}
