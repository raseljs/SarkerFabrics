import { Router, type Response, type NextFunction } from "express";
import { requireAdmin } from "../../common/middleware/admin.middleware.js";
import { isPaymentGatewayId } from "./payment.types.js";
import { getPaymentSettings, listAvailablePaymentGateways, savePaymentGatewaySettings } from "./payment.settings.service.js";
import { PaymentSettingsError, paymentSettingsError } from "./payment.settings.validation.js";

function settingsError(error: unknown, response: Response, next: NextFunction) {
  if (error instanceof PaymentSettingsError) response.status(error.statusCode).json({ success: false, message: error.message });
  else next(error);
}

export const adminPaymentRouter = Router();
adminPaymentRouter.use(requireAdmin);
adminPaymentRouter.use((_request, response, next) => { response.setHeader("Cache-Control", "no-store"); next(); });
adminPaymentRouter.get("/settings", async (_request, response, next) => {
  try { response.json({ success: true, data: await getPaymentSettings() }); }
  catch (error) { settingsError(error, response, next); }
});
adminPaymentRouter.patch("/settings/:provider", async (request, response, next) => {
  try {
    if (!isPaymentGatewayId(request.params.provider)) throw paymentSettingsError("Unsupported payment gateway.");
    const actor = (request as typeof request & { user?: { email?: string } }).user?.email || "admin";
    response.json({ success: true, data: await savePaymentGatewaySettings(request.params.provider, request.body, actor) });
  } catch (error) { settingsError(error, response, next); }
});

export const publicPaymentRouter = Router();
publicPaymentRouter.use((_request, response, next) => { response.setHeader("Cache-Control", "no-store"); next(); });
publicPaymentRouter.get("/methods", async (_request, response) => {
  // If storage or encryption is unavailable, online payment fails closed and
  // shoppers can still place a cash-on-delivery order.
  let gateways: Awaited<ReturnType<typeof listAvailablePaymentGateways>> = [];
  try { gateways = await listAvailablePaymentGateways(); } catch { /* Keep COD available. */ }
  response.json({ success: true, data: { cashOnDelivery: true, gateways } });
});
