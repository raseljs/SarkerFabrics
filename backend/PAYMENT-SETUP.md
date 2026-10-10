# Payment gateways

Open **Admin → Payment Gateways** (`/admin/payments`). Enter your own merchant credentials, select **Production**, enable **Gateway Status**, then save that card. Cash on Delivery is always available. An online method appears at checkout only when the saved gateway is enabled, has every required field, and uses Production. Placeholder credentials are rejected; provider authentication still requires real merchant access.

Supported providers: bKash Merchant (tokenized checkout), shurjoPay, UddoktaPay, aamarPay, and SSLCommerz. Sandbox configurations can be saved for development but are never shown to public customers. Existing environment SSL credentials do not automatically activate checkout.

Credentials are encrypted in MongoDB and are never returned to the browser. Blank credential inputs retain saved values. To replace a key, enter its new value; to remove one, turn the gateway off and use the explicit removal option. Changes apply without restarting the backend. Keep the server encryption key backed up: `PAYMENTS_SETTINGS_ENCRYPTION_KEY` accepts 64 hexadecimal characters; the existing `COURIER_SETTINGS_ENCRYPTION_KEY` is used when a separate payment key is absent. Do not rotate that key without migrating existing encrypted settings and pending payment snapshots.

Before live use, set `API_PUBLIC_URL` to your publicly reachable HTTPS backend and `FRONTEND_URL` to your storefront. Providers cannot return or notify a localhost server. Configure the merchant account's allowed callback domain if required by that provider. Each order creates a unique return endpoint under `/api/v1/orders/payment/<provider>/<token>`; UddoktaPay notifications and SSLCommerz IPN use the same endpoint with `?notification=1`.

For UddoktaPay, use the HTTPS merchant installation URL supplied by your account (domain root or its `/api/checkout-v2` URL). The backend validates the destination and blocks private network addresses.

Orders use server-calculated prices and reserve stock for 30 minutes during payment. A browser return alone cannot mark an order paid. The backend checks the provider's authenticated verification response, transaction reference, order, amount and BDT currency; replayed callbacks cannot settle or email twice. Pending sessions keep an encrypted snapshot of the credentials that created them so administrative changes do not break verification. If a payment arrives after stock was released or verification remains uncertain, reconcile it with the merchant dashboard before resending or fulfilling the order.

No real merchant credentials or live payments were used to verify this implementation. After entering your credentials, complete your provider's onboarding and conduct its required merchant acceptance test before taking customer payments.

Official integration references:

- [bKash official integration](https://github.com/bKash-developer/bKash-for-woocommerce/blob/main/includes/classes/ApiComm.php)
- [shurjoPay direct API integration](https://web2.shurjopay.com.bd/frontend-developers/direct-integration-with-api)
- [UddoktaPay checkout](https://uddoktapay.readme.io/reference/create-charge-api-guideline) and [verification](https://uddoktapay.readme.io/reference/verify-payment-api-guideline)
- [aamarPay JSON checkout](https://aamarpay.readme.io/reference/initiate-payment-json) and [transaction search](https://aamarpay.readme.io/reference/search-transaction)
- [SSLCommerz v4 integration](https://developer.sslcommerz.com/doc/v4/)
