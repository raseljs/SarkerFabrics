# Facebook Pixel Setup

Open **Facebook Pixel Setup** in the admin menu and add the numeric Meta Pixel ID from your Meta Events Manager. A descriptive name is optional. Enable the pixel when you want the storefront to send events. The storefront refreshes active IDs on navigation, when the tab becomes visible, and every 60 seconds; deactivated IDs stop receiving application events after that refresh. The screenshot's example ID is never installed automatically.

Pixel IDs are saved in MongoDB and managed through the admin page. Browser Pixel setup needs no API token or `.env` secret. Server Conversions API and Facebook Page permissions are separate integrations and are not configured by this feature.

The admin table supports editing, activating/deactivating, searching and deleting entries. Deletion archives the entry and disables it. Up to 20 current entries and 10 active entries are allowed. Concurrent requests cannot add the same ID twice or exceed these limits.

The public `/api/v1/pixels` endpoint exposes only active Pixel IDs; admin configuration endpoints require the existing verified admin authentication. Both responses use `Cache-Control: no-store`. Only numeric IDs are accepted, so pasted JavaScript cannot be executed.

Use Meta Events Manager's **Test Events** or the Meta Pixel Helper extension to verify your own ID after activation. With no active ID, the storefront does not load the Meta tracking script. Browser extensions or blocked tracking requests can prevent events from arriving.

The browser integration sends explicit `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout` and `Purchase` events, using BDT and saved catalogue prices/order totals. `AddToCart` runs only after the cart API succeeds. `Purchase` runs for a newly confirmed cash-on-delivery order, or a server-verified paid online order created in the same browser session. Purchase events are deduplicated per pixel and order. Historical confirmations, failed payments and cancelled/refunded orders do not create purchase events.

Admin, authentication, account, invoice and order tracking pages are excluded. URLs with customer/order parameters are excluded; public campaign parameters such as `fbclid` and `utm_source` remain supported. Customer names, contact details, addresses and automatic advanced matching are not passed to the SDK. The processed paid callback URL is cleared before sending its purchase event.

Primary implementation references: [Meta Pixel reference](https://developers.facebook.com/docs/meta-pixel/reference/), [Meta's official browser script](https://connect.facebook.net/en_US/fbevents.js), and [Meta's maintained Pixel integration](https://github.com/facebookincubator/Facebook-Pixel-for-Wordpress/blob/main/core/class-facebookpixel.php).
