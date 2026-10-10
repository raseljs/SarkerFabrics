export const PAYMENT_GATEWAY_IDS = ["bkash", "shurjopay", "uddoktapay", "aamarpay", "sslcommerz"] as const;
export type PaymentGatewayId = typeof PAYMENT_GATEWAY_IDS[number];
export type PaymentEnvironment = "production" | "sandbox";

export type PaymentGatewayConfig = {
  id: PaymentGatewayId;
  enabled: boolean;
  environment: PaymentEnvironment;
  values: Record<string, string>;
  credentials: Record<string, string>;
};
export type PaymentGatewayField = { key: string; label: string };
export type PaymentGatewayDefinition = {
  id: PaymentGatewayId;
  name: string;
  credentials: readonly PaymentGatewayField[];
  values: readonly PaymentGatewayField[];
  requiresEmail?: boolean;
};

export const PAYMENT_GATEWAY_DEFINITIONS: readonly PaymentGatewayDefinition[] = [
  { id: "bkash", name: "bKash", credentials: [
    { key: "username", label: "User name" }, { key: "password", label: "Password" },
    { key: "appKey", label: "App key" }, { key: "appSecret", label: "App secret" },
  ], values: [] },
  { id: "shurjopay", name: "shurjoPay", credentials: [
    { key: "username", label: "User name" }, { key: "password", label: "Password" },
  ], values: [{ key: "prefix", label: "Merchant prefix" }], requiresEmail: true },
  { id: "uddoktapay", name: "UddoktaPay", credentials: [{ key: "apiKey", label: "API key" }],
    values: [{ key: "apiBaseUrl", label: "Merchant API base URL" }], requiresEmail: true },
  { id: "aamarpay", name: "aamarPay", credentials: [
    { key: "storeId", label: "Store ID" }, { key: "signatureKey", label: "Signature key" },
  ], values: [], requiresEmail: true },
  { id: "sslcommerz", name: "SSLCOMMERZ", credentials: [
    { key: "storeId", label: "Store ID" }, { key: "storePassword", label: "Store password" },
  ], values: [], requiresEmail: true },
];

export const isPaymentGatewayId = (value: unknown): value is PaymentGatewayId =>
  typeof value === "string" && (PAYMENT_GATEWAY_IDS as readonly string[]).includes(value);
export function paymentGatewayDefinition(id: PaymentGatewayId): PaymentGatewayDefinition {
  return PAYMENT_GATEWAY_DEFINITIONS.find((gateway) => gateway.id === id)!;
}
