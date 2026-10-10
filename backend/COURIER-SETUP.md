# Courier integration

Open **Orders → Courier Integration** in the admin menu. This page and the **Orders** controls support Steadfast, Pathao and RedX. Select one order or up to 25 orders, choose a courier, and send them after reviewing any required destination fields. Each order has its own destination selection in a bulk booking. Bookings use saved customer details and order amounts.

## Configure credentials

In **Orders → Courier Integration → Courier API Setup**, enter the merchant credentials and save each courier. You can also set pickup store IDs, production/sandbox mode and the default parcel weight here. Admin saves apply immediately to the next courier request without restarting the backend.

Credentials are write-only: saved forms show whether a key is configured, never its value. Leave a credential input blank to retain it; explicitly select **Clear saved credential** to remove it. Blank pickup store IDs clear their defaults. Only the listed courier fields are editable; this feature cannot edit arbitrary `.env` values such as database, SMTP or payment credentials.

Admin values are encrypted with AES-256-GCM and stored in MongoDB. They override matching `backend/.env` values. Existing `.env` placeholders continue to work as a fallback for settings that have never been saved in the panel. Credentials stay on the backend and must never be added to a `NEXT_PUBLIC_` variable.

Set **`COURIER_SETTINGS_ENCRYPTION_KEY`** on the backend once: a stable, random 32-byte key encoded as 64 hexadecimal characters. Keep it secret and back it up separately from MongoDB. Preserve the same key when restarting, deploying another instance or restoring a database; changing or losing it prevents reading saved courier settings. Do not paste this encryption key into the admin form. Every backend instance using the same database must use the same key.

| Courier | Required credentials | Optional default |
| --- | --- | --- |
| Steadfast | `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` | — |
| Pathao | `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_USERNAME`, `PATHAO_PASSWORD` | `PATHAO_STORE_ID` |
| RedX | `REDX_ACCESS_TOKEN` | `REDX_PICKUP_STORE_ID` |

`PATHAO_ENVIRONMENT` and `REDX_ENVIRONMENT` default to `production`; use `sandbox` only with the corresponding provider's sandbox account. `COURIER_DEFAULT_WEIGHT_KG` defaults to `0.5`. Enter the actual parcel weight when booking if it differs. Provider API hosts are fixed in the server adapter.

Restart the backend only after editing `.env`, including the initial encryption key setup, then refresh the admin page. Admin form saves need no restart. Add credentials for the courier you intend to use; all three are optional. With blank credentials, booking is disabled and no external courier request is sent. Saving settings verifies their format; merchant API credentials are checked by the provider when loading locations or submitting a booking.

Pathao requires a merchant store plus the recipient city and zone; select the area where available. RedX requires a pickup store and delivery area. Store lists and destination lists are loaded from the configured provider. Steadfast uses the saved recipient address directly. A default store can be set in the admin setup form, in `.env`, or selected in the booking dialog.

## Booking and tracking

- **Send to courier** saves the courier consignment and tracking identifiers. **Track** opens the provider's tracking page when available. **Sync** fetches the current provider status.
- Paid orders have a zero cash collection amount. Pending cash-on-delivery orders collect their saved order total. Unpaid online orders cannot be booked.
- Customer delivery remains free across Bangladesh. Courier service fees are billed by the courier to the merchant; the integration does not add them to checkout or automatically mark a payment paid.
- Already booked orders cannot be submitted again. An explicit provider rejection can be retried after correction. A timeout or uncertain response stays locked because the provider may have accepted the parcel.
- For an uncertain booking, first find its consignment in your courier merchant panel. Use **Resolve booking** with that consignment ID to verify it. Never create another parcel before checking the provider panel. An in-progress booking can be reconciled after the initial request has settled.
- Courier cancellation is shown as a provider status. Order cancellation, inventory release and payment changes continue through the existing admin order controls.

No automatic courier booking runs when a customer checks out. The admin must send the order explicitly.

## Provider references

- [Steadfast's official integration plugin](https://wordpress.org/plugins/steadfast-api/) and [published plugin source](https://plugins.svn.wordpress.org/steadfast-api/trunk/includes/functions.php)
- [Pathao merchant developer API](https://merchant.pathao.com/courier/developer-api)
- [RedX developer API](https://redx.com.bd/developer-api/)

Automated tests use mocked provider responses. A successful real booking must be verified with your merchant credentials and a parcel you intend to dispatch.
